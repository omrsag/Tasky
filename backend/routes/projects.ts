
import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";
import fs = require("fs");
import path = require("path");

export function registerProjectRoutes(app: express.Express): void {
    app.get("/projects", (_req, res) => {
        const workspaceId: number = res.locals.workspaceId;
        const userId: number = res.locals.userId;
        const role: string = res.locals.role;

        let sql = `
            SELECT
            p.id,
            p.name,
            p.description,
            p.manager_id,
            DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
            p.status,
            p.created_at
            FROM projects p
            WHERE p.workspace_id = ?
        `;

        const params: number[] = [workspaceId];

        if (role === "Manager") {
            sql += " AND p.manager_id = ?";
            params.push(userId);
        } else if (role === "Member") {
            sql += `
            AND EXISTS (
                SELECT 1
                FROM project_members pm
                WHERE pm.project_id = p.id
                AND pm.user_id = ?
            )
            `;
            params.push(userId);
        } else if (role !== "Admin") {
            res.status(403).json({ message: "Access denied" });
            return;
        }

        sql += " ORDER BY p.created_at DESC, p.id DESC";

        db.query<mysql.RowDataPacket[]>(
            sql,
            params,
            (error, results) => {
            if (error) {
                console.error("Failed to fetch projects:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            const projects = results.map((project) => ({
                id: project.id,
                name: project.name,
                description: project.description,
                managerId: project.manager_id,
                startDate: project.start_date,
                endDate: project.end_date,
                status: project.status,
                createdAt: project.created_at,
            }));

            res.status(200).json({ projects });
        });
    });

    app.post("/projects", requireAdmin, (req, res) => {
        const name = req.body?.name;
        const managerId = req.body?.managerId;
        const description = req.body?.description;
        const startDate = req.body?.startDate;
        const endDate = req.body?.endDate;

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 255 ||
            !Number.isSafeInteger(managerId) ||
            managerId <= 0 || 
            (description != null && typeof description !== "string")

        ) {
            res.status(400).json({ message: "Invalid project data" });
            return;
        }

        if (
            startDate != null &&
            (typeof startDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
                Number.isNaN(Date.parse(startDate)) ||
                new Date(startDate).toISOString().slice(0, 10) !== startDate)
        ) {
            res.status(400).json({ message: "Invalid start date" });
            return;
        }
        
        if (
            endDate != null &&
            (typeof endDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
                Number.isNaN(Date.parse(endDate)) ||
                new Date(endDate).toISOString().slice(0, 10) !== endDate)
        ) {
            res.status(400).json({ message: "Invalid end date" });
            return;
        }

        if (
            startDate != null &&
            endDate != null &&
            endDate < startDate
        ) {
            res.status(400).json({
                message: "End date cannot be before start date",
            });
            return;
        }

        const projectDescription =
        typeof description === "string" ? description.trim() : null;

        db.query<mysql.RowDataPacket[]>(
            `SELECT id FROM users
            WHERE id = ?
            AND workspace_id = ?
            AND role = 'Manager'
            AND status = 'Active'
            LIMIT 1`,
            [managerId, res.locals.workspaceId],
            (error, results) => {
            if (error) {
                console.error("Failed to validate project manager:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            if (results.length === 0) {
                res.status(400).json({ message: "Invalid project manager" });
                return;
            }

            db.query<mysql.ResultSetHeader>(
                `INSERT INTO projects
                (workspace_id, manager_id, name, description, start_date, end_date, status)
                VALUES (?, ?, ?, ?, ?, ?, 'Active')`,
                [
                    res.locals.workspaceId,
                    managerId,
                    name.trim(),
                    projectDescription,
                    startDate ?? null,
                    endDate ?? null,
                ],
                (error, result) => {
                if (error) {
                    console.error("Failed to create project:", error);
                    res.status(500).json({ message: "Something went wrong" });
                    return;
                }

                res.status(201).json({
                    project: {
                    id: result.insertId,
                    name: name.trim(),
                    managerId,
                    description: projectDescription,
                    status: "Active",
                    startDate: startDate ?? null,
                    endDate: endDate ?? null,
                    },
                });
            });
        });
    });

    app.get("/projects/:id", (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        let sql = `
            SELECT
                p.id,
                p.name,
                p.description,
                p.manager_id,
                DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
                p.status,
                p.created_at
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

        db.query<mysql.RowDataPacket[]>(
            sql,
            params,
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

                res.status(200).json({
                    project: {
                        id: project.id,
                        name: project.name,
                        description: project.description,
                        managerId: project.manager_id,
                        startDate: project.start_date,
                        endDate: project.end_date,
                        status: project.status,
                        createdAt: project.created_at,
                    },
                });
            }
        );
    });

    app.patch("/projects/:id", (req, res) => {
        const projectId = Number(req.params.id);

        if (!Number.isSafeInteger(projectId) || projectId <= 0) {
            res.status(400).json({ message: "Invalid project ID" });
            return;
        }

        const data = req.body;
        const allowedFields = [
            "name",
            "description",
            "managerId",
            "startDate",
            "endDate",
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
            res.status(400).json({ message: "Invalid project data" });
            return;
        }

        const { name, description, managerId, startDate, endDate, status } = data;

        const invalidName =
            name !== undefined &&
            (typeof name !== "string" ||
                !name.trim() ||
                name.trim().length > 255);

        const invalidDescription =
            description !== undefined &&
            description !== null &&
            typeof description !== "string";

        const invalidManagerId =
            managerId !== undefined &&
            (!Number.isSafeInteger(managerId) || managerId <= 0);

        const invalidStartDate =
            startDate != null &&
            (typeof startDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
                Number.isNaN(Date.parse(startDate)) ||
                new Date(startDate).toISOString().slice(0, 10) !== startDate);

        const invalidEndDate =
            endDate != null &&
            (typeof endDate !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(endDate) ||
                Number.isNaN(Date.parse(endDate)) ||
                new Date(endDate).toISOString().slice(0, 10) !== endDate);


        const invalidStatus =
            status !== undefined &&
            !["Active", "Completed", "Archived"].includes(status);

        if (
            invalidName ||
            invalidDescription ||
            invalidManagerId ||
            invalidStartDate ||
            invalidEndDate ||
            invalidStatus
        ) {
            res.status(400).json({ message: "Invalid project data" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT
                id,
                manager_id,
                status,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                EXISTS (
                    SELECT 1
                    FROM users u
                    WHERE u.id = ?
                        AND u.workspace_id = projects.workspace_id
                        AND u.role = 'Manager'
                        AND u.status = 'Active'
                ) AS manager_is_valid,
                EXISTS (
                    SELECT 1
                    FROM tasks t
                    WHERE t.project_id = projects.id
                        AND t.status <> 'Done'
                ) AS has_unfinished_tasks
            FROM projects
            WHERE id = ? AND workspace_id = ?
            LIMIT 1`,
            [managerId ?? null, projectId, res.locals.workspaceId],
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

                if (
                    managerId !== undefined &&
                    res.locals.role !== "Admin"
                ) {
                    res.status(403).json({
                        message: "Only Admin can change the project manager",
                    });
                    return;
                }

                if (managerId !== undefined && !project.manager_is_valid) {
                    res.status(400).json({
                    message: "Invalid project manager",
                });
                    return;
                }

                const updatedStartDate =
                    startDate !== undefined ? startDate : project.start_date;

                const updatedEndDate =
                    endDate !== undefined ? endDate : project.end_date;

                if (
                    updatedStartDate != null &&
                    updatedEndDate != null &&
                    updatedEndDate < updatedStartDate
                ) {
                    res.status(400).json({
                        message: "End date cannot be before start date",
                    });
                    return;
                }

                if (project.status !== "Active") {
                    const isAdminReactivation =
                        res.locals.role === "Admin" &&
                        status === "Active" &&
                        Object.keys(data).length === 1;

                    if (!isAdminReactivation) {
                        res.status(403).json({
                            message: "Project is read-only",
                        });
                        return;
                    }
                }

                if (
                    project.status === "Active" &&
                    status === "Completed" &&
                    project.has_unfinished_tasks
                ) {
                    res.status(400).json({
                        message: "All project tasks must be Done before completion",
                    });
                    return;
                }

                const updates: string[] = [];
                const values: (string | number | null)[] = [];

                if (name !== undefined) {
                    updates.push("name = ?");
                    values.push(name.trim());
                }

                if (description !== undefined) {
                    updates.push("description = ?");
                    values.push(description === null ? null : description.trim());
                }

                if (managerId !== undefined) {
                    updates.push("manager_id = ?");
                    values.push(managerId);
                }

                if (startDate !== undefined) {
                    updates.push("start_date = ?");
                    values.push(startDate);
                }

                if (endDate !== undefined) {
                    updates.push("end_date = ?");
                    values.push(endDate);
                }

                if (status !== undefined) {
                    updates.push("status = ?");
                    values.push(status);
                }

                db.query<mysql.ResultSetHeader>(
                    `UPDATE projects
                    SET ${updates.join(", ")}
                    WHERE id = ? AND workspace_id = ?`,
                    [...values, projectId, res.locals.workspaceId],
                    (updateError) => {
                        if (updateError) {
                            console.error("Failed to update project:", updateError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                        }

                        db.query<mysql.RowDataPacket[]>(
                            `SELECT
                                id,
                                name,
                                description,
                                manager_id,
                                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date,
                                status,
                                created_at
                            FROM projects
                            WHERE id = ? AND workspace_id = ?
                            LIMIT 1`,
                            [projectId, res.locals.workspaceId],
                            (fetchError, results) => {
                                if (fetchError) {
                                    console.error("Failed to fetch updated project:", fetchError);
                                    res.status(500).json({ message: "Something went wrong" });
                                    return;
                                }

                                if (results.length === 0) {
                                    res.status(404).json({ message: "Project not found" });
                                    return;
                                }

                                const updatedProject = results[0];

                                res.status(200).json({
                                    project: {
                                        id: updatedProject.id,
                                        name: updatedProject.name,
                                        description: updatedProject.description,
                                        managerId: updatedProject.manager_id,
                                        startDate: updatedProject.start_date,
                                        endDate: updatedProject.end_date,
                                        status: updatedProject.status,
                                        createdAt: updatedProject.created_at,
                                    },
                                });
                            }
                        );
                    }
                );
            }
        );
    });

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
