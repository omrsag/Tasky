
import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";
import bcrypt = require("bcrypt");

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

    app.post("/users", requireAdmin, (req, res) => {
        const { fullName, email, password, role } = req.body ?? {};

        if (
            typeof fullName !== "string" ||
            !fullName.trim() ||
            fullName.trim().length > 255 ||
            typeof email !== "string" ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            email.trim().length > 255 ||
            typeof password !== "string" ||
            password.length < 8 ||
            (role !== "Manager" && role !== "Member")
        ) {
            res.status(400).json({ message: "Invalid user data" });
            return;
        }

        const trimmedName = fullName.trim();
        const normalizedEmail = email.trim().toLowerCase();

        bcrypt.hash(password, 10, (hashError, passwordHash) => {
            if (hashError) {
            console.error("Password hashing failed:", hashError);
            res.status(500).json({ message: "Something went wrong" });
            return;
            }

            db.query<mysql.ResultSetHeader>(
            `INSERT INTO users
            (workspace_id, full_name, email, password_hash, role, status)
            VALUES (?, ?, ?, ?, ?, 'Active')`,
            [
                res.locals.workspaceId,
                trimmedName,
                normalizedEmail,
                passwordHash,
                role,
            ],
            (error, result) => {
                if (error) {
                if (error.code === "ER_DUP_ENTRY") {
                    res.status(409).json({ message: "Email already exists" });
                    return;
                }

                console.error("Failed to create user:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
                }

                res.status(201).json({
                user: {
                    id: result.insertId,
                    fullName: trimmedName,
                    email: normalizedEmail,
                    role,
                    status: "Active",
                },
                });
            }
            );
        });
    });

    app.patch("/users/:id", requireAdmin, (req, res) => {
        const userId = Number(req.params.id);
        const data = req.body;

        if (!Number.isSafeInteger(userId) || userId <= 0) {
            res.status(400).json({ message: "Invalid user ID" });
            return;
        }

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            Object.keys(data).length === 0 ||
            Object.keys(data).some(
            (key) => !["fullName", "email", "role", "status"].includes(key)
            )
        ) {
            res.status(400).json({ message: "Invalid user data" });
            return;
        }

        const { fullName, email, role, status } = data;

        const invalidName =
            fullName !== undefined &&
            (typeof fullName !== "string" ||
                !fullName.trim() ||
                fullName.trim().length > 255);

        const invalidEmail =
            email !== undefined &&
            (typeof email !== "string" ||
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
                email.trim().length > 255);

        const invalidRole =
            role !== undefined &&
            role !== "Manager" &&
            role !== "Member";

        const invalidStatus =
            status !== undefined &&
            status !== "Active" &&
            status !== "Disabled";

        if (invalidName || invalidEmail || invalidRole || invalidStatus) {
            res.status(400).json({ message: "Invalid user data" });
            return;
        }

        db.query<mysql.RowDataPacket[]>(
            `SELECT u.id, u.role,
            EXISTS(
                SELECT 1 FROM projects
                WHERE manager_id = u.id
            ) AS has_projects,
            EXISTS(
                SELECT 1 FROM project_members
                WHERE user_id = u.id
            ) AS has_memberships,
            EXISTS(
                SELECT 1 FROM tasks
                WHERE assignee_id = u.id AND status <> 'Done'
            ) AS has_unfinished_tasks
            FROM users u
            WHERE u.id = ?
            AND u.workspace_id = ?
            AND u.role IN ('Manager', 'Member')
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

            if (
                user.role === "Manager" &&
                user.has_projects &&
                (role === "Member" || status === "Disabled")
            ) {
                res.status(400).json({
                message: "Reassign managed projects first",
                });
                return;
            }

            if (
                user.role === "Member" &&
                role === "Manager" &&
                (user.has_memberships || user.has_unfinished_tasks)
            ) {
                res.status(400).json({
                message: "Remove project memberships and reassign unfinished tasks first",
                });
                return;
            }

            // Update provided fields only
            db.query<mysql.ResultSetHeader>(
                `UPDATE users
                SET full_name = COALESCE(?, full_name),
                    email = COALESCE(?, email),
                    role = COALESCE(?, role),
                    status = COALESCE(?, status)
                WHERE id = ?
                AND workspace_id = ?
                AND role IN ('Manager', 'Member')`,
                [
                fullName === undefined ? null : fullName.trim(),
                email === undefined ? null : email.trim().toLowerCase(),
                role ?? null,
                status ?? null,
                userId,
                res.locals.workspaceId,
                ],
                (error) => {
                    if (error) {
                        if (error.code === "ER_DUP_ENTRY") {
                            res.status(409).json({
                                message: "Email already exists",
                            });
                            return;
                        }

                        console.error("Failed to update user:", error);
                        res.status(500).json({
                            message: "Something went wrong",
                        });
                        return;
                    }

                    res.status(200).json({
                        message: "User updated successfully",
                    });
                }
            );
        });
    });

}
