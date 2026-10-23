import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import multer = require("multer");
import fs = require("fs");
import { attachmentUpload } from "../middleware/uploads";

export function registerAttachmentRoutes(app: express.Express): void {
    app.get("/tasks/:id/attachments", (req, res) => {
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
             JOIN users u ON u.id = ?
                 AND u.workspace_id = p.workspace_id
             WHERE t.id = ?
               AND p.workspace_id = ?
               AND (
                 u.role = 'Admin'
                 OR (
                   u.role = 'Manager'
                   AND p.manager_id = u.id
                 )
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
                    res.status(404).json({
                        message: "Task not found",
                    });
                    return;
                }

                db.query<mysql.RowDataPacket[]>(
                    `SELECT
                        a.id,
                        a.task_id AS taskId,
                        a.uploader_id AS uploaderId,
                        u.full_name AS uploaderName,
                        a.file_name AS fileName,
                        a.created_at AS createdAt
                     FROM attachments a
                     JOIN users u ON u.id = a.uploader_id
                     WHERE a.task_id = ?
                     ORDER BY a.created_at ASC, a.id ASC`,
                    [taskId],
                    (error, attachments) => {
                        if (error) {
                            console.error(
                                "Failed to fetch attachments:",
                                error
                            );
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        res.status(200).json({ attachments });
                    }
                );
            }
        );
    });

    app.post("/tasks/:id/attachments", (req, res) => {
        const taskId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;

        if (!Number.isSafeInteger(taskId) || taskId <= 0) {
            res.status(400).json({ message: "Invalid task ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                t.id,
                t.assignee_id AS assigneeId,
                p.status AS projectStatus,
                u.role AS userRole
            FROM tasks t
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = ?
                AND u.workspace_id = p.workspace_id
            WHERE t.id = ?
            AND p.workspace_id = ?
            AND (
                u.role = 'Admin'
                OR (
                u.role = 'Manager'
                AND p.manager_id = u.id
                )
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

                const task = tasks[0];

                if (task.projectStatus !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                if (
                    task.userRole === "Member" &&
                    Number(task.assigneeId) !== userId
                ) {
                    res.status(403).json({
                        message: "Only the task assignee can upload attachments",
                    });
                    return;
                }

                attachmentUpload.single("file")(req, res, (uploadError) => {
                    if (uploadError) {
                        if (uploadError instanceof multer.MulterError) {
                            if (uploadError.code === "LIMIT_FILE_SIZE") {
                                res.status(413).json({
                                    message: "File exceeds the 10 MB limit",
                                });
                                return;
                            }

                            res.status(400).json({
                                message: "Invalid file upload",
                            });
                            return;
                        }

                        console.error("Failed to upload attachment:", uploadError);
                        res.status(500).json({
                            message: "Something went wrong",
                        });
                        return;
                    }

                    const file = req.file;

                    if (!file) {
                        res.status(400).json({
                            message: "Attachment file is required",
                        });
                        return;
                    }

                    const filePath = `uploads/attachments/${file.filename}`;

                    db.query<mysql.ResultSetHeader>(
                        `INSERT INTO attachments
                            (task_id, uploader_id, file_name, file_path)
                        VALUES (?, ?, ?, ?)`,
                        [taskId, userId, file.originalname, filePath],
                        (error, result) => {
                            if (error) {
                                console.error("Failed to save attachment:", error);

                                fs.unlink(file.path, (cleanupError) => {
                                    if (
                                        cleanupError &&
                                        cleanupError.code !== "ENOENT"
                                    ) {
                                        console.error(
                                            "Failed to clean up uploaded file:",
                                            cleanupError
                                        );
                                    }

                                    res.status(500).json({
                                        message: "Something went wrong",
                                    });
                                });
                                return;
                            }

                            db.query<mysql.RowDataPacket[]>(
                                `SELECT
                                    a.id,
                                    a.task_id AS taskId,
                                    a.uploader_id AS uploaderId,
                                    u.full_name AS uploaderName,
                                    a.file_name AS fileName,
                                    a.created_at AS createdAt
                                FROM attachments a
                                JOIN users u ON u.id = a.uploader_id
                                WHERE a.id = ?
                                LIMIT 1`,
                                [result.insertId],
                                (error, attachments) => {
                                    if (error || attachments.length === 0) {
                                        console.error(
                                            "Failed to fetch uploaded attachment:",
                                            error
                                        );
                                        res.status(500).json({
                                            message: "Something went wrong",
                                        });
                                        return;
                                    }

                                    res.status(201).json({
                                        attachment: attachments[0],
                                    });
                                }
                            );
                        }
                    );
                });
            }
        );
    });

}
