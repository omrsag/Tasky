import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import fs = require("fs");
import path = require("path");

export function registerTaskRoutes(app: express.Express): void {
    app.get("/projects/:id/tasks", (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        let sql = `
            SELECT p.id
            FROM projects p
            WHERE p.id = ? AND p.workspace_id = ?
        `;

        const params: number[] = [
            projectId,
            res.locals.workspaceId,
        ];

        if (res.locals.role === "Manager") {
            sql += " AND p.manager_id = ?";
            params.push(res.locals.userId);
        } else if (res.locals.role === "Member") {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                        AND pm.user_id = ?
                )
            `;
            params.push(res.locals.userId);
        } else if (res.locals.role !== "Admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        sql += " LIMIT 1";

        db.query<mysql.RowDataPacket[]>(
            sql,
            params,
            (error, results) => {
                if (error) {
                    console.error("Failed to validate project access:", error);
                    res.status(500).json({ message: "Something went wrong" });
                    return;
                }

                if (results.length === 0) {
                    res.status(404).json({ message: "Project not found" });
                    return;
                }

                db.query<mysql.RowDataPacket[]>(
                    `SELECT
                        id,
                        project_id,
                        assignee_id,
                        title,
                        description,
                        priority,
                        status,
                        DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                        (
                            due_date IS NOT NULL
                            AND due_date < UTC_DATE()
                            AND status <> 'Done'
                        ) AS is_overdue,
                        created_at
                    FROM tasks
                    WHERE project_id = ?
                    ORDER BY created_at DESC, id DESC`,
                    [projectId],
                    (tasksError, taskResults) => {
                        if (tasksError) {
                            console.error("Failed to fetch project tasks:", tasksError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                        }

                        const tasks = taskResults.map((task) => ({
                            id: task.id,
                            projectId: task.project_id,
                            assigneeId: task.assignee_id,
                            title: task.title,
                            description: task.description,
                            priority: task.priority,
                            status: task.status,
                            dueDate: task.due_date,
                            isOverdue: Boolean(task.is_overdue),
                            createdAt: task.created_at,
                        }));

                        res.status(200).json({ tasks });
                    }
                );
            }
        );
    });

    app.post("/projects/:id/tasks", (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        const title = req.body?.title;
        const description = req.body?.description;
        const priority = req.body?.priority;
        const assigneeId = req.body?.assigneeId;
        const dueDate = req.body?.dueDate;

        if (
            typeof title !== "string" ||
            !title.trim() ||
            title.trim().length > 255 ||
            !["Low", "Medium", "High"].includes(priority) ||
            !Number.isSafeInteger(assigneeId) ||
            assigneeId <= 0 ||
            (description != null && typeof description !== "string")
        ) {
            res.status(400).json({ message: "Invalid task data" });
            return;
        }

        if (
            dueDate != null &&
            (typeof dueDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
                Number.isNaN(Date.parse(dueDate)) ||
                new Date(dueDate).toISOString().slice(0, 10) !== dueDate)
        ) {
            res.status(400).json({ message: "Invalid due date" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                id,
                manager_id,
                status,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
            FROM projects
            WHERE id = ? AND workspace_id = ?
            LIMIT 1`,
            [projectId, res.locals.workspaceId],
            (error, results) => {
                if (error) {
                    console.error("Failed to fetch project:", error);
                    res.status(500).json({ message: "Something went wrong" });
                    return;
                }

                if (results.length === 0) {
                    res.status(404).json({ message: "Project not found" });
                    return;
                }

                const project = results[0];

                if (
                    res.locals.role !== "Admin" &&
                    (res.locals.role !== "Manager" ||
                        project.manager_id !== res.locals.userId)
                ) {
                    res.status(404).json({ message: "Project not found" });
                    return;
                }

                if (project.status !== "Active") {
                    res.status(403).json({ message: "Project is read-only" });
                    return;
                }

                if (
                    dueDate != null &&
                    ((project.start_date != null &&
                        dueDate < project.start_date) ||
                        (project.end_date != null &&
                            dueDate > project.end_date))
                ) {
                    res.status(400).json({
                        message: "Task due date must be within project dates",
                    });
                    return;
                }

                db.query<mysql.RowDataPacket[]>(
                    `SELECT pm.id
                    FROM project_members pm
                    JOIN users u ON u.id = pm.user_id
                    WHERE pm.project_id = ?
                        AND pm.user_id = ?
                        AND u.workspace_id = ?
                        AND u.role = 'Member'
                        AND u.status = 'Active'
                    LIMIT 1`,
                    [projectId, assigneeId, res.locals.workspaceId],
                    (memberError, memberResults) => {
                        if (memberError) {
                            console.error(
                                "Failed to validate task assignee:",
                                memberError
                            );
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        if (memberResults.length === 0) {
                            res.status(400).json({
                                message: "Invalid task assignee",
                            });
                            return;
                        }

                        const taskDescription =
                            typeof description === "string"
                                ? description.trim()
                                : null;

                        db.query<mysql.ResultSetHeader>(
                            `INSERT INTO tasks
                            (project_id, assignee_id, title, description,
                            priority, status, due_date)
                            VALUES (?, ?, ?, ?, ?, 'Todo', ?)`,
                            [
                                projectId,
                                assigneeId,
                                title.trim(),
                                taskDescription,
                                priority,
                                dueDate ?? null,
                            ],
                            (insertError, result) => {
                                if (insertError) {
                                    console.error(
                                        "Failed to create task:",
                                        insertError
                                    );
                                    res.status(500).json({
                                        message: "Something went wrong",
                                    });
                                    return;
                                }

                                const today = new Date().toISOString().slice(0, 10);

                                res.status(201).json({
                                    task: {
                                        id: result.insertId,
                                        projectId,
                                        assigneeId,
                                        title: title.trim(),
                                        description: taskDescription,
                                        priority,
                                        status: "Todo",
                                        dueDate: dueDate ?? null,
                                        isOverdue: dueDate != null && dueDate < today,
                                    },
                                });
                            }
                        );
                    }
                );
            }
        );
    });

    app.get("/tasks/:id", (req, res) => {
        const taskId = Number(req.params.id);

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        let sql = `
            SELECT
                t.id,
                t.project_id,
                t.assignee_id,
                t.title,
                t.description,
                t.priority,
                t.status,
                DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
                (
                    t.due_date IS NOT NULL
                    AND t.due_date < UTC_DATE()
                    AND t.status <> 'Done'
                ) AS is_overdue,
                t.created_at
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = ? AND p.workspace_id = ?
        `;

        const params: number[] = [
            taskId,
            res.locals.workspaceId,
        ];

        if (res.locals.role === "Manager") {
            sql += " AND p.manager_id = ?";
            params.push(res.locals.userId);
        } else if (res.locals.role === "Member") {
            sql += `
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                        AND pm.user_id = ?
                )
            `;
            params.push(res.locals.userId);
        } else if (res.locals.role !== "Admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        sql += " LIMIT 1";

        db.query<mysql.RowDataPacket[]>(
            sql,
            params,
            (error, results) => {
                if (error) {
                    console.error("Failed to fetch task:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (results.length === 0) {
                    res.status(404).json({
                        message: "Task not found",
                    });
                    return;
                }

                const task = results[0];

                res.status(200).json({
                    task: {
                        id: task.id,
                        projectId: task.project_id,
                        assigneeId: task.assignee_id,
                        title: task.title,
                        description: task.description,
                        priority: task.priority,
                        status: task.status,
                        dueDate: task.due_date,
                        isOverdue: Boolean(task.is_overdue),
                        createdAt: task.created_at,
                    },
                });
            }
        );
    });

    app.patch("/tasks/:id", (req, res) => {
        const taskId = Number(req.params.id);

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        const data = req.body;
        const allowedFields = [
            "title",
            "description",
            "priority",
            "assigneeId",
            "dueDate",
            "status",
        ];

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            Object.keys(data).length === 0 ||
            Object.keys(data).some(
                (key) => !allowedFields.includes(key)
            )
        ) {
            res.status(400).json({ message: "Invalid task data" });
            return;
        }

        const {
            title,
            description,
            priority,
            assigneeId,
            dueDate,
            status,
        } = data;

        const invalidTitle =
            title !== undefined &&
            (typeof title !== "string" ||
                !title.trim() ||
                title.trim().length > 255);

        const invalidDescription =
            description !== undefined &&
            description !== null &&
            typeof description !== "string";

        const invalidPriority =
            priority !== undefined &&
            !["Low", "Medium", "High"].includes(priority);

        const invalidAssigneeId =
            assigneeId !== undefined &&
            (!Number.isSafeInteger(assigneeId) ||
                assigneeId <= 0);

        const invalidDueDate =
            dueDate != null &&
            (typeof dueDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) ||
                Number.isNaN(Date.parse(dueDate)) ||
                new Date(dueDate).toISOString().slice(0, 10) !== dueDate);

        const invalidStatus =
            status !== undefined &&
            !["Todo", "In Progress", "Review", "Done"].includes(status);

        if (
            invalidTitle ||
            invalidDescription ||
            invalidPriority ||
            invalidAssigneeId ||
            invalidDueDate ||
            invalidStatus
        ) {
            res.status(400).json({ message: "Invalid task data" });
            return;
        }

        let sql = `
            SELECT
                t.id,
                t.project_id,
                t.assignee_id,
                t.title,
                t.description,
                t.priority,
                t.status,
                DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
                p.manager_id,
                p.status AS project_status,
                DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = ? AND p.workspace_id = ?
        `;

        const params: number[] = [
            taskId,
            res.locals.workspaceId,
        ];

        if (res.locals.role === "Manager") {
            sql += " AND p.manager_id = ?";
            params.push(res.locals.userId);
        } else if (res.locals.role === "Member") {
            sql += `
                AND t.assignee_id = ?
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                        AND pm.user_id = ?
                )
            `;
            params.push(res.locals.userId, res.locals.userId);
        } else if (res.locals.role !== "Admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        sql += " LIMIT 1";

        db.query<mysql.RowDataPacket[]>(
            sql,
            params,
            (error, results) => {
                if (error) {
                    console.error("Failed to fetch task:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (results.length === 0) {
                    res.status(404).json({
                        message: "Task not found",
                    });
                    return;
                }

                const task = results[0];

                if (task.project_status !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                const assigneeChanged =
                    assigneeId !== undefined &&
                    assigneeId !== Number(task.assignee_id);

                if (res.locals.role === "Member") {
                    if (
                        Object.keys(data).length !== 1 ||
                        status === undefined
                    ) {
                        res.status(403).json({
                            message: "Members can only update task status",
                        });
                        return;
                    }

                    if (status === "Done") {
                        res.status(403).json({
                            message: "Members cannot mark tasks as Done",
                        });
                        return;
                    }

                    if (task.status === "Review") {
                        res.status(403).json({
                            message: "Only Admin or Manager can review tasks",
                        });
                        return;
                    }
                }

                if (
                    assigneeChanged &&
                    status !== undefined &&
                    status !== "Todo"
                ) {
                    res.status(400).json({
                        message: "Reassigning a task resets its status to Todo",
                    });
                    return;
                }

                const allowedTransitions: Record<string, string[]> = {
                    Todo: ["In Progress"],
                    "In Progress": ["Review"],
                    Review: ["Done", "In Progress"],
                    Done: [],
                };

                if (
                    status !== undefined &&
                    !assigneeChanged &&
                    status !== task.status &&
                    !allowedTransitions[task.status]?.includes(status)
                ) {
                    res.status(400).json({
                        message: "Invalid task status transition",
                    });
                    return;
                }

                if (
                    dueDate != null &&
                    ((task.start_date != null &&
                        dueDate < task.start_date) ||
                        (task.end_date != null &&
                            dueDate > task.end_date))
                ) {
                    res.status(400).json({
                        message: "Task due date must be within project dates",
                    });
                    return;
                }

                const updateTask = (): void => {
                    const updates: string[] = [];
                    const values: (string | number | null)[] = [];

                    if (title !== undefined) {
                        updates.push("title = ?");
                        values.push(title.trim());
                    }

                    if (description !== undefined) {
                        updates.push("description = ?");
                        values.push(
                            description === null ? null : description.trim()
                        );
                    }

                    if (priority !== undefined) {
                        updates.push("priority = ?");
                        values.push(priority);
                    }

                    if (assigneeId !== undefined) {
                        updates.push("assignee_id = ?");
                        values.push(assigneeId);
                    }

                    if (dueDate !== undefined) {
                        updates.push("due_date = ?");
                        values.push(dueDate);
                    }

                    if (assigneeChanged) {
                        updates.push("status = 'Todo'");
                    } else if (status !== undefined) {
                        updates.push("status = ?");
                        values.push(status);
                    }

                    db.query<mysql.ResultSetHeader>(
                        `UPDATE tasks
                        SET ${updates.join(", ")}
                        WHERE id = ? AND project_id = ?`,
                        [...values, taskId, task.project_id],
                        (updateError) => {
                            if (updateError) {
                                console.error(
                                    "Failed to update task:",
                                    updateError
                                );
                                res.status(500).json({
                                    message: "Something went wrong",
                                });
                                return;
                            }

                            db.query<mysql.RowDataPacket[]>(
                                `SELECT
                                    id,
                                    project_id,
                                    assignee_id,
                                    title,
                                    description,
                                    priority,
                                    status,
                                    DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date,
                                    (
                                        due_date IS NOT NULL
                                        AND due_date < UTC_DATE()
                                        AND status <> 'Done'
                                    ) AS is_overdue,
                                    created_at
                                FROM tasks
                                WHERE id = ? AND project_id = ?
                                LIMIT 1`,
                                [taskId, task.project_id],
                                (fetchError, results) => {
                                    if (fetchError) {
                                        console.error(
                                            "Failed to fetch updated task:",
                                            fetchError
                                        );
                                        res.status(500).json({
                                            message: "Something went wrong",
                                        });
                                        return;
                                    }

                                    if (results.length === 0) {
                                        res.status(404).json({
                                            message: "Task not found",
                                        });
                                        return;
                                    }

                                    const updatedTask = results[0];

                                    res.status(200).json({
                                        task: {
                                            id: updatedTask.id,
                                            projectId: updatedTask.project_id,
                                            assigneeId: updatedTask.assignee_id,
                                            title: updatedTask.title,
                                            description: updatedTask.description,
                                            priority: updatedTask.priority,
                                            status: updatedTask.status,
                                            dueDate: updatedTask.due_date,
                                            isOverdue: Boolean(updatedTask.is_overdue),
                                            createdAt: updatedTask.created_at,
                                        },
                                    });
                                }
                            );
                        }
                    );
                };

                if (assigneeId !== undefined) {
                    db.query<mysql.RowDataPacket[]>(
                        `SELECT pm.id
                        FROM project_members pm
                        JOIN users u ON u.id = pm.user_id
                        WHERE pm.project_id = ?
                            AND pm.user_id = ?
                            AND u.workspace_id = ?
                            AND u.role = 'Member'
                            AND u.status = 'Active'
                        LIMIT 1`,
                        [
                            task.project_id,
                            assigneeId,
                            res.locals.workspaceId,
                        ],
                        (memberError, memberResults) => {
                            if (memberError) {
                                console.error(
                                    "Failed to validate task assignee:",
                                    memberError
                                );
                                res.status(500).json({
                                    message: "Something went wrong",
                                });
                                return;
                            }

                            if (memberResults.length === 0) {
                                res.status(400).json({
                                    message: "Invalid task assignee",
                                });

                                return;
                            }

                            updateTask();
                        }
                    );

                    return;
                }

                updateTask();
            }
        );
    });

    app.delete("/tasks/:id", (req, res) => {
        const taskId = Number(req.params.id);

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({
                message: "Invalid task ID",
            });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                t.id,
                t.project_id,
                p.manager_id,
                p.status AS project_status
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            WHERE t.id = ? AND p.workspace_id = ?
            LIMIT 1`,
            [taskId, res.locals.workspaceId],
            (error, results) => {
                if (error) {
                    console.error("Failed to fetch task:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (results.length === 0) {
                    res.status(404).json({
                        message: "Task not found",
                    });
                    return;
                }

                const task = results[0];

                if (
                    res.locals.role !== "Admin" &&
                    (res.locals.role !== "Manager" ||
                        task.manager_id !== res.locals.userId)
                ) {
                    res.status(404).json({
                        message: "Task not found",
                    });
                    return;
                }

                if (task.project_status !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                db.query<mysql.RowDataPacket[]>(
                    `SELECT file_path
                    FROM attachments
                    WHERE task_id = ?`,
                    [taskId],
                    (filesError, fileResults) => {
                        if (filesError) {
                            console.error(
                                "Failed to fetch attachment paths:",
                                filesError
                            );
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        const filePaths: string[] = fileResults.map(
                            (file) => file.file_path
                        );

                        db.query<mysql.ResultSetHeader>(
                            `DELETE FROM notifications
                            WHERE task_id = ?`,
                            [taskId],
                            (notificationsError) => {
                                if (notificationsError) {
                                    console.error(
                                        "Failed to delete task notifications:",
                                        notificationsError
                                    );
                                    res.status(500).json({
                                        message: "Something went wrong",
                                    });
                                    return;
                                }

                                db.query<mysql.ResultSetHeader>(
                                    `DELETE FROM comments
                                    WHERE task_id = ?`,
                                    [taskId],
                                    (commentsError) => {
                                        if (commentsError) {
                                            console.error(
                                                "Failed to delete task comments:",
                                                commentsError
                                            );
                                            res.status(500).json({
                                                message: "Something went wrong",
                                            });
                                            return;
                                        }

                                        db.query<mysql.ResultSetHeader>(
                                            `DELETE FROM attachments
                                            WHERE task_id = ?`,
                                            [taskId],
                                            (attachmentsError) => {
                                                if (attachmentsError) {
                                                    console.error(
                                                        "Failed to delete task attachments:",
                                                        attachmentsError
                                                    );
                                                    res.status(500).json({
                                                        message: "Something went wrong",
                                                    });
                                                    return;
                                                }

                                                db.query<mysql.ResultSetHeader>(
                                                    `DELETE FROM tasks
                                                    WHERE id = ? AND project_id = ?`,
                                                    [taskId, task.project_id],
                                                    (taskError, result) => {
                                                        if (taskError) {
                                                            console.error(
                                                                "Failed to delete task:",
                                                                taskError
                                                            );
                                                            res.status(500).json({
                                                                message: "Something went wrong",
                                                            });
                                                            return;
                                                        }

                                                        if (result.affectedRows === 0) {
                                                            res.status(404).json({
                                                                message: "Task not found",
                                                            });
                                                            return;
                                                        }

                                                        const attachmentsDirectory = path.resolve(
                                                            process.cwd(),
                                                            "uploads",
                                                            "attachments"
                                                        );

                                                        let remaining = filePaths.length;
                                                        let failed = false;

                                                        if (remaining === 0) {
                                                            res.status(200).json({
                                                                message: "Task deleted successfully",
                                                            });
                                                            return;
                                                        }

                                                        const finish = (error?: Error): void => {
                                                            if (error) {
                                                                failed = true;
                                                                console.error(
                                                                    "Failed to delete attachment file:",
                                                                    error
                                                                );
                                                            }

                                                            remaining--;

                                                            if (remaining === 0) {
                                                                res.status(failed ? 500 : 200).json({
                                                                    message: failed
                                                                        ? "Task deleted, but some attachment files could not be removed"
                                                                        : "Task deleted successfully",
                                                                });
                                                            }
                                                        };

                                                        for (const filePath of filePaths) {
                                                            const absolutePath = path.resolve(
                                                                process.cwd(),
                                                                filePath
                                                            );

                                                            if (
                                                                !absolutePath.startsWith(
                                                                    attachmentsDirectory + path.sep
                                                                )
                                                            ) {
                                                                finish(
                                                                    new Error(
                                                                        `Invalid attachment path: ${filePath}`
                                                                    )
                                                                );
                                                                continue;
                                                            }

                                                            fs.unlink(absolutePath, (error) => {
                                                                if (error && error.code !== "ENOENT") {
                                                                    finish(error);
                                                                    return;
                                                                }

                                                                finish();
                                                            });
                                                        }
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });

}
