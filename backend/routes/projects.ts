
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

        if (
            typeof name !== "string" ||
            !name.trim() ||
            name.trim().length > 255 ||
            !Number.isSafeInteger(managerId) ||
            managerId <= 0
        ) {
            res.status(400).json({ message: "Invalid project data" });
            return;
        }

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
                (workspace_id, manager_id, name, status)
                VALUES (?, ?, ?, 'Active')`,
                [res.locals.workspaceId, managerId, name.trim()],
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
                    status: "Active",
                    },
                });
            });
        });
    });

}
