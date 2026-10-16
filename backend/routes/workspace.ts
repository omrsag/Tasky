import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";

export function registerWorkspaceRoutes(app: express.Express): void {
    app.get("/workspace", (_req, res) => {
    db.query<mysql.RowDataPacket[]>(
        "SELECT id, name FROM workspaces WHERE id = ? LIMIT 1",
        [res.locals.workspaceId],
        (error, results) => {
        if (error) {
            console.error("Failed to fetch workspace:", error);
            res.status(500).json({ message: "Something went wrong" });
            return;
        }

        if (results.length === 0) {
            res.status(404).json({ message: "Workspace not found" });
            return;
        }

        res.status(200).json({
            workspace: {
            id: results[0].id,
            name: results[0].name,
            },
        });
        }
    );
    });

    app.patch("/workspace", requireAdmin, (req, res) => {
        const name = req.body?.name;

        if (
            typeof name !== "string" ||
            name.trim().length === 0 ||
            name.trim().length > 255
        ) {
            res.status(400).json({ message: "Invalid workspace name" });
            return;
        }

        const trimmedName = name.trim();

        db.query<mysql.ResultSetHeader>(
            "UPDATE workspaces SET name = ? WHERE id = ?",
            [trimmedName, res.locals.workspaceId],
            (error, result) => {
            if (error) {
                console.error("Failed to update workspace:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            if (result.affectedRows === 0) {
                res.status(404).json({ message: "Workspace not found" });
                return;
            }

            res.status(200).json({
                workspace: {
                id: res.locals.workspaceId,
                name: trimmedName,
                },
            });
            }
        );
    });
}
