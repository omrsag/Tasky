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

}
