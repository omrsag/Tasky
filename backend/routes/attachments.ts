import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import multer = require("multer");
import fs = require("fs");
import { attachmentUpload } from "../middleware/uploads";
import path = require("path");

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

    app.get("/attachments/:id/download", (req, res) => {
        const attachmentId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;

        if (!Number.isSafeInteger(attachmentId) || attachmentId <= 0) {
            res.status(400).json({ message: "Invalid attachment ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                a.file_name AS fileName,
                a.file_path AS filePath
            FROM attachments a
            JOIN tasks t ON t.id = a.task_id
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = ?
                AND u.workspace_id = p.workspace_id
            WHERE a.id = ?
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
            [userId, attachmentId, workspaceId],
            (error, attachments) => {
                if (error) {
                    console.error("Failed to fetch attachment:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (attachments.length === 0) {
                    res.status(404).json({
                        message: "Attachment not found",
                    });
                    return;
                }

                const attachment = attachments[0];

                if (
                    typeof attachment.filePath !== "string" ||
                    !attachment.filePath.trim() ||
                    typeof attachment.fileName !== "string" ||
                    !attachment.fileName.trim()
                ) {
                    res.status(500).json({
                        message: "Invalid attachment file",
                    });
                    return;
                }

                const backendRoot = path.resolve(__dirname, "../..");
                const attachmentsRoot = path.join(
                    backendRoot,
                    "uploads",
                    "attachments"
                );

                const fullPath = path.isAbsolute(attachment.filePath)
                    ? path.resolve(attachment.filePath)
                    : path.resolve(backendRoot, attachment.filePath);

                if (!fullPath.startsWith(attachmentsRoot + path.sep)) {
                    console.error("Invalid attachment file path:", fullPath);
                    res.status(500).json({
                        message: "Invalid attachment file path",
                    });
                    return;
                }

                res.download(fullPath, attachment.fileName, (error) => {
                    if (!error) {
                        return;
                    }

                    console.error("Failed to download attachment:", error);

                    if (res.headersSent) {
                        res.end();
                        return;
                    }

                    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                        res.status(404).json({
                            message: "Attachment file not found",
                        });
                        return;
                    }

                    res.status(500).json({
                        message: "Something went wrong",
                    });
                });
            }
        );
    });

    app.delete("/attachments/:id", (req, res) => {
        const attachmentId = Number(req.params.id);
        const workspaceId = res.locals.workspaceId;
        const userId = res.locals.userId;

        if (!Number.isSafeInteger(attachmentId) || attachmentId <= 0) {
            res.status(400).json({ message: "Invalid attachment ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                a.id,
                a.uploader_id AS uploaderId,
                a.file_path AS filePath,
                p.status AS projectStatus,
                p.manager_id AS managerId,
                u.role AS userRole
            FROM attachments a
            JOIN tasks t ON t.id = a.task_id
            JOIN projects p ON p.id = t.project_id
            JOIN users u ON u.id = ?
                AND u.workspace_id = p.workspace_id
            WHERE a.id = ?
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
            [userId, attachmentId, workspaceId],
            (error, attachments) => {
                if (error) {
                    console.error("Failed to check attachment access:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (attachments.length === 0) {
                    res.status(404).json({
                        message: "Attachment not found",
                    });
                    return;
                }

                const attachment = attachments[0];

                const canDelete =
                    attachment.userRole === "Admin" ||
                    (
                        attachment.userRole === "Manager" &&
                        Number(attachment.managerId) === userId
                    ) ||
                    Number(attachment.uploaderId) === userId;

                if (!canDelete) {
                    res.status(403).json({
                        message: "You do not have permission to delete this attachment",
                    });
                    return;
                }

                if (attachment.projectStatus !== "Active") {
                    res.status(403).json({
                        message: "Project is read-only",
                    });
                    return;
                }

                if (
                    typeof attachment.filePath !== "string" ||
                    !attachment.filePath.trim()
                ) {
                    res.status(500).json({
                        message: "Invalid attachment file path",
                    });
                    return;
                }

                const backendRoot = path.resolve(__dirname, "../..");
                const attachmentsRoot = path.join(
                    backendRoot,
                    "uploads",
                    "attachments"
                );

                const fullPath = path.isAbsolute(attachment.filePath)
                    ? path.resolve(attachment.filePath)
                    : path.resolve(backendRoot, attachment.filePath);

                if (!fullPath.startsWith(attachmentsRoot + path.sep)) {
                    console.error("Invalid attachment file path:", fullPath);
                    res.status(500).json({
                        message: "Invalid attachment file path",
                    });
                    return;
                }

                db.query<mysql.ResultSetHeader>(
                    "DELETE FROM attachments WHERE id = ?",
                    [attachmentId],
                    (error, result) => {
                        if (error) {
                            console.error("Failed to delete attachment:", error);
                            res.status(500).json({
                                message: "Something went wrong",
                            });
                            return;
                        }

                        if (result.affectedRows === 0) {
                            res.status(404).json({
                                message: "Attachment not found",
                            });
                            return;
                        }

                        fs.unlink(fullPath, (error) => {
                            if (error && error.code !== "ENOENT") {
                                console.error(
                                    "Attachment file cleanup failed:",
                                    error
                                );
                                res.status(500).json({
                                    message: "Attachment deleted, but file cleanup failed",
                                });
                                return;
                            }

                            res.status(200).json({
                                message: "Attachment deleted successfully",
                            });
                        });
                    }
                );
            }
        );
    });

}
