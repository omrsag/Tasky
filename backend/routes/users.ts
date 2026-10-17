
import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";

export function registerUsersRoutes(app: express.Express): void {
    app.get("/users", requireAdmin, (_req, res) => {
        db.query<mysql.RowDataPacket[]>(
            `SELECT id, full_name, email, role, status
            FROM users
            WHERE workspace_id = ?
            ORDER BY id ASC`,
            [res.locals.workspaceId],
            (error, results) => {
            if (error) {
                console.error("Failed to fetch users:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            const users = results.map((user) => ({
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                status: user.status,
            }));

            res.status(200).json({ users });
            }
        );
    });

    app.get("/users/:id", requireAdmin, (req, res) => {
        const userId = Number(req.params.id);

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT id, full_name, email, role, status
            FROM users
            WHERE id = ? AND workspace_id = ?
            LIMIT 1`,
            [userId, res.locals.workspaceId],
            (error, results) => {
            if (error) {
                console.error("Failed to fetch user:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            if (results.length === 0) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            const user = results[0];

            res.status(200).json({
                user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                status: user.status,
                },
            });
            }
        );
    });

}
