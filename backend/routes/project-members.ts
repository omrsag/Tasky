import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

export function registerProjectMemberRoutes(app: express.Express): void {
    app.get("/projects/:id/members", (req, res) => {
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

        const params: number[] = [projectId, res.locals.workspaceId];

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

        db.query<mysql.RowDataPacket[]>(sql, params, (error, results) => {
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
                    u.id,
                    u.full_name,
                    u.email,
                    u.role,
                    u.status
                FROM project_members pm
                JOIN users u ON u.id = pm.user_id
                WHERE pm.project_id = ?
                    AND u.workspace_id = ?
                ORDER BY u.full_name ASC, u.id ASC`,
                [projectId, res.locals.workspaceId],
                (membersError, results) => {
                    if (membersError) {
                        console.error("Failed to fetch project members:", membersError);
                        res.status(500).json({ message: "Something went wrong" });
                        return;
                    }

                    const members = results.map((member) => ({
                        id: member.id,
                        fullName: member.full_name,
                        email: member.email,
                        role: member.role,
                        status: member.status,
                    }));

                    res.status(200).json({ members });
                }
            );
        });
    });

    app.post("/projects/:id/members", (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        const userId = req.body?.userId;

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT id, manager_id, status
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

                db.query<mysql.RowDataPacket[]>(
                    `SELECT id
                    FROM users
                    WHERE id = ?
                        AND workspace_id = ?
                        AND role = 'Member'
                        AND status = 'Active'
                    LIMIT 1`,
                    [userId, res.locals.workspaceId],
                    (memberError, memberResults) => {
                        if (memberError) {
                            console.error("Failed to validate project member:", memberError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                        }

                        if (memberResults.length === 0) {
                            res.status(400).json({
                                message: "Invalid project member",
                            });
                            return;
                        }

                        db.query<mysql.RowDataPacket[]>(
                            `SELECT id
                            FROM project_members
                            WHERE project_id = ? AND user_id = ?
                            LIMIT 1`,
                            [projectId, userId],
                            (membershipError, membershipResults) => {
                                if (membershipError) {
                                    console.error("Failed to check project membership:", membershipError);
                                    res.status(500).json({ message: "Something went wrong" });
                                    return;
                                }

                                if (membershipResults.length > 0) {
                                    res.status(409).json({
                                        message: "User is already a project member",
                                    });
                                    return;
                                }

                                db.query<mysql.ResultSetHeader>(
                                    `INSERT INTO project_members (project_id, user_id)
                                    VALUES (?, ?)`,
                                    [projectId, userId],
                                    (insertError, result) => {
                                        if (insertError) {
                                            if (insertError.code === "ER_DUP_ENTRY") {
                                                res.status(409).json({
                                                    message: "User is already a project member",
                                                });
                                                return;
                                            }

                                            console.error("Failed to add project member:", insertError);
                                            res.status(500).json({ message: "Something went wrong" });
                                            return;
                                        }

                                        res.status(201).json({
                                            membership: {
                                                id: result.insertId,
                                                projectId,
                                                userId,
                                            },
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
    
    app.delete("/projects/:id/members/:userId", (req, res) => {
        const projectId = Number(req.params.id);
        const userId = Number(req.params.userId);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT id, manager_id, status
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

                db.query<mysql.RowDataPacket[]>(
                    `SELECT id
                    FROM project_members
                    WHERE project_id = ? AND user_id = ?
                    LIMIT 1`,
                    [projectId, userId],
                    (membershipError, membershipResults) => {
                        if (membershipError) {
                            console.error("Failed to validate project membership:", membershipError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                        }

                        if (membershipResults.length === 0) {
                            res.status(404).json({
                                message: "Project member not found",
                            });
                            return;
                        }

                        db.query<mysql.RowDataPacket[]>(
                            `SELECT id
                            FROM tasks
                            WHERE project_id = ?
                                AND assignee_id = ?
                                AND status <> 'Done'
                            LIMIT 1`,
                            [projectId, userId],
                            (tasksError, taskResults) => {
                                if (tasksError) {
                                    console.error("Failed to check assigned tasks:", tasksError);
                                    res.status(500).json({ message: "Something went wrong" });
                                    return;
                                }

                                if (taskResults.length > 0) {
                                    res.status(409).json({
                                        message: "Member has unfinished assigned tasks",
                                    });
                                    return;
                                }

                                db.query<mysql.ResultSetHeader>(
                                    `DELETE FROM project_members
                                    WHERE project_id = ? AND user_id = ?`,
                                    [projectId, userId],
                                    (deleteError, result) => {
                                        if (deleteError) {
                                            console.error("Failed to remove project member:", deleteError);
                                            res.status(500).json({ message: "Something went wrong" });
                                            return;
                                        }

                                        if (result.affectedRows === 0) {
                                            res.status(404).json({
                                                message: "Project member not found",
                                            });
                                            return;
                                        }

                                        res.status(200).json({
                                            message: "Project member removed successfully",
                                        });
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
