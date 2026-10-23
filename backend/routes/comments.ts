import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

export function registerCommentRoutes(app: express.Express): void {
    app.get("/tasks/:id/comments", (req, res) => {
        const taskId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT t.id
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = ? AND u.workspace_id = p.workspace_id
            WHERE t.id = ?
            AND p.workspace_id = ?
            AND (
                u.role = 'Admin'
                OR (u.role = 'Manager' AND p.manager_id = u.id)
                OR (
                u.role = 'Member'
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                    AND pm.user_id = u.id
                )
                )
            )
            LIMIT 1`,
            [userId, taskId, workspaceId],
            (error, tasks) => {
                if (error) {
                    console.error("Failed to check task access:", error);
                    res.status(500).json({ message: "Something went wrong" });
                    return;
                }

                if (tasks.length === 0) {
                    res.status(404).json({ message: "Task not found" });
                    return;
                }

                db.query<mysql.RowDataPacket[]>(
                    `SELECT
                        c.id,
                        c.task_id AS taskId,
                        c.author_id AS authorId,
                        u.full_name AS authorName,
                        c.content,
                        c.created_at AS createdAt
                    FROM comments c
                    JOIN users u ON u.id = c.author_id
                    WHERE c.task_id = ?
                    ORDER BY c.created_at ASC, c.id ASC`,
                    [taskId],
                    (error, comments) => {
                        if (error) {
                            console.error("Failed to fetch comments:", error);
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        res.status(200).json({ comments });
                    }
                );
            }
        );
    });

    app.post("/tasks/:id/comments", (req, res) => {
        const taskId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;
        const content = req.body?.content;

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        if (typeof content !== "string" || !content.trim()) {
            res.status(400).json({ message: "Invalid comment content" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT t.id, p.status AS projectStatus
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = ? AND u.workspace_id = p.workspace_id
            WHERE t.id = ?
            AND p.workspace_id = ?
            AND (
                u.role = 'Admin'
                OR (u.role = 'Manager' AND p.manager_id = u.id)
                OR (
                u.role = 'Member'
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                    AND pm.user_id = u.id
                )
                )
            )
            LIMIT 1`,
            [userId, taskId, workspaceId],
            (error, tasks) => {
                if (error) {
                    console.error("Failed to check task access:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (tasks.length === 0) {
                    res.status(404).json({ message: "Task not found" });
                    return;
                }

                if (tasks[0].projectStatus !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                db.query<mysql.ResultSetHeader>(
                    `INSERT INTO comments (task_id, author_id, content)
                    VALUES (?, ?, ?)`,
                    [taskId, userId, content.trim()],
                    (error, result) => {
                        if (error) {
                            console.error("Failed to create comment:", error);
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        db.query<mysql.RowDataPacket[]>(
                            `SELECT
                                c.id,
                                c.task_id AS taskId,
                                c.author_id AS authorId,
                                u.full_name AS authorName,
                                c.content,
                                c.created_at AS createdAt
                            FROM comments c
                            JOIN users u ON u.id = c.author_id
                            WHERE c.id = ?`,
                            [result.insertId],
                            (error, comments) => {
                                if (error) {
                                    console.error(
                                        "Failed to fetch created comment:",
                                        error
                                    );
                                    res.status(500).json({
                                        message: "Something went wrong",
                                    });
                                    return;
                                }

                                res.status(201).json({
                                    comment: comments[0],
                                });
                            }
                        );
                    }
                );
            }
        );
    });

}
