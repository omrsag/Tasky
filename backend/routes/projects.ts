
import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";

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

                // Additional update rules will be added next.

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

}
