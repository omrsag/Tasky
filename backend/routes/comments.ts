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

    app.patch("/comments/:id", (req, res) => {
        const commentId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;
        const content = req.body?.content;

        if (!Number.isSafeInteger(commentId) || commentId <= 0) {
            res.status(400).json({ message: "Invalid comment ID" });
            return;
        }

        if (typeof content !== "string" || !content.trim()) {
            res.status(400).json({ message: "Invalid comment content" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                c.id,
                c.task_id AS taskId,
                c.author_id AS authorId,
                author.full_name AS authorName,
                c.created_at AS createdAt,
                p.status AS projectStatus
            FROM comments c
            JOIN tasks t ON t.id = c.task_id
            JOIN projects p ON p.id = t.project_id
            JOIN users author ON author.id = c.author_id
            JOIN users viewer ON viewer.id = ?
                AND viewer.workspace_id = p.workspace_id
            WHERE c.id = ?
            AND p.workspace_id = ?
            AND (
                viewer.role = 'Admin'
                OR (
                viewer.role = 'Manager'
                AND p.manager_id = viewer.id
                )
                OR (
                viewer.role = 'Member'
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                    AND pm.user_id = viewer.id
                )
                )
            )
            LIMIT 1`,
            [userId, commentId, workspaceId],
            (error, comments) => {
                if (error) {
                    console.error("Failed to check comment access:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (comments.length === 0) {
                    res.status(404).json({ message: "Comment not found" });
                    return;
                }

                const comment = comments[0];

                if (comment.authorId !== userId) {
                    res.status(403).json({
                        message: "You can only edit your own comments",
                    });
                    return;
                }

                if (comment.projectStatus !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                const trimmedContent = content.trim();

                db.query<mysql.ResultSetHeader>(
                    `UPDATE comments
                    SET content = ?
                    WHERE id = ? AND author_id = ?`,
                    [trimmedContent, commentId, userId],
                    (error, result) => {
                        if (error) {
                            console.error("Failed to update comment:", error);
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        if (result.affectedRows === 0) {
                            res.status(404).json({
                                message: "Comment not found",
                            });
                            return;
                        }

                        res.status(200).json({
                            comment: {
                                id: comment.id,
                                taskId: comment.taskId,
                                authorId: comment.authorId,
                                authorName: comment.authorName,
                                content: trimmedContent,
                                createdAt: comment.createdAt,
                            },
                        });
                    }
                );
            }
        );
    });

    app.delete("/comments/:id", (req, res) => {
        const commentId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;

        if (!Number.isSafeInteger(commentId) || commentId <= 0) {
            res.status(400).json({ message: "Invalid comment ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                c.id,
                c.author_id AS authorId,
                p.status AS projectStatus,
                p.manager_id AS managerId,
                viewer.role AS viewerRole
            FROM comments c
            JOIN tasks t ON t.id = c.task_id
            JOIN projects p ON p.id = t.project_id
            JOIN users viewer ON viewer.id = ?
                AND viewer.workspace_id = p.workspace_id
            WHERE c.id = ?
            AND p.workspace_id = ?
            AND (
                viewer.role = 'Admin'
                OR (
                viewer.role = 'Manager'
                AND p.manager_id = viewer.id
                )
                OR (
                viewer.role = 'Member'
                AND EXISTS (
                    SELECT 1
                    FROM project_members pm
                    WHERE pm.project_id = p.id
                    AND pm.user_id = viewer.id
                )
                )
            )
            LIMIT 1`,
            [userId, commentId, workspaceId],
            (error, comments) => {
                if (error) {
                    console.error("Failed to check comment access:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (comments.length === 0) {
                    res.status(404).json({
                        message: "Comment not found",
                    });
                    return;
                }

                const comment = comments[0];

                const canDelete =
                    Number(comment.authorId) === userId ||
                    comment.viewerRole === "Admin" ||
                    (
                        comment.viewerRole === "Manager" &&
                        Number(comment.managerId) === userId
                    );

                if (!canDelete) {
                    res.status(403).json({
                        message: "You do not have permission to delete this comment",
                    });
                    return;
                }

                if (comment.projectStatus !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                db.query<mysql.ResultSetHeader>(
                    "DELETE FROM comments WHERE id = ?",
                    [commentId],
                    (error, result) => {
                        if (error) {
                            console.error("Failed to delete comment:", error);
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        if (result.affectedRows === 0) {
                            res.status(404).json({
                                message: "Comment not found",
                            });
                            return;
                        }

                        res.status(200).json({
                            message: "Comment deleted successfully",
                        });
                    }
                );
            }
        );
    });

}
