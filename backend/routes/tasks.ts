import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

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
                        createdAt: task.created_at,
                    },
                });
            }
        );
    });

}
