import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";
import fs = require("fs");
import path = require("path");

export function registerProjectDeletionRoutes(app: express.Express): void {
    app.delete("/projects/:id", requireAdmin, (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT id
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

                db.query<mysql.RowDataPacket[]>(
                    `SELECT a.file_path
                    FROM attachments a
                    JOIN tasks t ON t.id = a.task_id
                    WHERE t.project_id = ?`,
                    [projectId],
                    (filesError, results) => {
                        if (filesError) {
                            console.error("Failed to fetch attachment paths:", filesError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                        }

                        const filePaths: string[] = results.map(
                            (file) => file.file_path
                        );

                        db.query<mysql.ResultSetHeader>(
                            `DELETE FROM notifications
                            WHERE task_id IN (
                                SELECT id
                                FROM tasks
                                WHERE project_id = ?
                            )`,
                            [projectId],
                            (deleteError) => {
                                if (deleteError) {
                                    console.error("Failed to delete project notifications:", deleteError);
                                    res.status(500).json({ message: "Something went wrong" });
                                    return;
                                }

                                db.query<mysql.ResultSetHeader>(
                                    `DELETE FROM comments
                                    WHERE task_id IN (
                                        SELECT id
                                        FROM tasks
                                        WHERE project_id = ?
                                    )`,
                                    [projectId],
                                    (commentsError) => {
                                        if (commentsError) {
                                            console.error("Failed to delete project comments:", commentsError);
                                            res.status(500).json({ message: "Something went wrong" });
                                            return;
                                        }

                                        db.query<mysql.ResultSetHeader>(
                                            `DELETE FROM attachments
                                            WHERE task_id IN (
                                                SELECT id
                                                FROM tasks
                                                WHERE project_id = ?
                                            )`,
                                            [projectId],
                                            (attachmentsError) => {
                                                if (attachmentsError) {
                                                    console.error("Failed to delete project attachments:", attachmentsError);
                                                    res.status(500).json({ message: "Something went wrong" });
                                                    return;
                                                }

                                                db.query<mysql.ResultSetHeader>(
                                                    `DELETE FROM tasks
                                                    WHERE project_id = ?`,
                                                    [projectId],
                                                    (tasksError) => {
                                                        if (tasksError) {
                                                            console.error("Failed to delete project tasks:", tasksError);
                                                            res.status(500).json({ message: "Something went wrong" });
                                                            return;
                                                        }

                                                        db.query<mysql.ResultSetHeader>(
                                                            `DELETE FROM project_members
                                                            WHERE project_id = ?`,
                                                            [projectId],
                                                            (membersError) => {
                                                                if (membersError) {
                                                                    console.error("Failed to delete project memberships:", membersError);
                                                                    res.status(500).json({ message: "Something went wrong" });
                                                                    return;
                                                                }

                                                                db.query<mysql.ResultSetHeader>(
                                                                    `DELETE FROM projects
                                                                    WHERE id = ? AND workspace_id = ?`,
                                                                    [projectId, res.locals.workspaceId],
                                                                    (projectError, result) => {
                                                                        if (projectError) {
                                                                            console.error("Failed to delete project:", projectError);
                                                                            res.status(500).json({ message: "Something went wrong" });
                                                                            return;
                                                                        }

                                                                        if (result.affectedRows === 0) {
                                                                            res.status(404).json({ message: "Project not found" });
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
                                                                                message: "Project deleted successfully",
                                                                            });
                                                                            return;
                                                                        }

                                                                        const finish = (error?: Error) => {
                                                                            if (error) {
                                                                                failed = true;
                                                                                console.error("Failed to delete attachment file:", error);
                                                                            }

                                                                            remaining--;

                                                                            if (remaining === 0) {
                                                                                res.status(failed ? 500 : 200).json({
                                                                                    message: failed
                                                                                        ? "Project deleted, but some attachment files could not be removed"
                                                                                        : "Project deleted successfully",
                                                                                });
                                                                            }
                                                                        };

                                                                        for (const filePath of filePaths) {
                                                                            const absolutePath = path.resolve(process.cwd(), filePath);

                                                                            if (!absolutePath.startsWith(attachmentsDirectory + path.sep)) {
                                                                                finish(new Error(`Invalid attachment path: ${filePath}`));
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
                    }
                );
            }
        );
    });

}
