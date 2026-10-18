import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import { requireAdmin } from "../middleware/auth";
import fs = require("fs");
import path = require("path");

function getWorkspaceFilePaths(
  workspaceId: number,
  callback: (error: Error | null, filePaths: string[]) => void
): void {
  db.query<mysql.RowDataPacket[]>(
    `SELECT profile_image_path AS file_path
     FROM users
     WHERE workspace_id = ?
       AND profile_image_path IS NOT NULL

     UNION ALL

     SELECT a.file_path
     FROM attachments a
     JOIN tasks t ON t.id = a.task_id
     JOIN projects p ON p.id = t.project_id
     WHERE p.workspace_id = ?`,
    [workspaceId, workspaceId],
    (error, results) => {
      if (error) {
        callback(error, []);
        return;
      }

      const filePaths: string[] = results.map(
        (row) => row.file_path as string
      );

      callback(null, filePaths);
    }
  );
}

function deleteWorkspaceRecords(
  workspaceId: number,
  callback: (error: Error | null, deleted: boolean) => void
): void {
  const queries: { sql: string; params: number[] }[] = [
    {
      sql: `DELETE FROM notifications
            WHERE recipient_id IN (
              SELECT id FROM users WHERE workspace_id = ?
            )
            OR task_id IN (
              SELECT t.id
              FROM tasks t
              JOIN projects p ON p.id = t.project_id
              WHERE p.workspace_id = ?
            )`,
      params: [workspaceId, workspaceId],
    },
    {
      sql: `DELETE FROM attachments
            WHERE task_id IN (
              SELECT t.id
              FROM tasks t
              JOIN projects p ON p.id = t.project_id
              WHERE p.workspace_id = ?
            )`,
      params: [workspaceId],
    },
    {
      sql: `DELETE FROM comments
            WHERE task_id IN (
              SELECT t.id
              FROM tasks t
              JOIN projects p ON p.id = t.project_id
              WHERE p.workspace_id = ?
            )`,
      params: [workspaceId],
    },
    {
      sql: `DELETE FROM tasks
            WHERE project_id IN (
              SELECT id FROM projects WHERE workspace_id = ?
            )`,
      params: [workspaceId],
    },
    {
      sql: `DELETE FROM project_members
            WHERE project_id IN (
              SELECT id FROM projects WHERE workspace_id = ?
            )`,
      params: [workspaceId],
    },
    {
      sql: "DELETE FROM projects WHERE workspace_id = ?",
      params: [workspaceId],
    },
    {
      sql: `DELETE FROM sessions
            WHERE user_id IN (
              SELECT id FROM users WHERE workspace_id = ?
            )`,
      params: [workspaceId],
    },
    {
      sql: "DELETE FROM users WHERE workspace_id = ?",
      params: [workspaceId],
    },
    {
      sql: "DELETE FROM workspaces WHERE id = ?",
      params: [workspaceId],
    },
  ];

  function executeNext(index: number): void {
    const query = queries[index];

    db.query<mysql.ResultSetHeader>(
      query.sql,
      query.params,
      (error, result) => {
        if (error) {
          callback(error, false);
          return;
        }

        if (index === queries.length - 1) {
          callback(null, result.affectedRows > 0);
          return;
        }

        executeNext(index + 1);
      }
    );
  }

  executeNext(0);
}

function deleteWorkspaceFiles(
  filePaths: string[],
  callback: (error: Error | null) => void
): void {
  const backendRoot = path.resolve(__dirname, "../..");
  const uploadsRoot = path.join(backendRoot, "uploads");

  function deleteNext(index: number): void {
    if (index === filePaths.length) {
      callback(null);
      return;
    }

    const storedPath = filePaths[index];

    if (typeof storedPath !== "string" || !storedPath.trim()) {
      callback(new Error("Invalid stored file path"));
      return;
    }

    const fullPath = path.isAbsolute(storedPath)
      ? path.resolve(storedPath)
      : path.resolve(backendRoot, storedPath);

    if (!fullPath.startsWith(uploadsRoot + path.sep)) {
      callback(new Error("File path is outside uploads directory"));
      return;
    }

    fs.unlink(fullPath, (error) => {
      if (error && error.code !== "ENOENT") {
        callback(error);
        return;
      }

      deleteNext(index + 1);
    });
  }

  deleteNext(0);
}

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

    app.delete("/workspace", requireAdmin, (_req, res) => {
        const workspaceId: number = res.locals.workspaceId;

        getWorkspaceFilePaths(workspaceId, (error, filePaths) => {
            if (error) {
                console.error("Failed to fetch workspace files:", error);
                res.status(500).json({ message: "Something went wrong" });
                return;
            }

            deleteWorkspaceRecords(workspaceId, (error, deleted) => {
                if (error) {
                    console.error("Failed to delete workspace records:", error);
                    res.status(500).json({
                        message: "Workspace deletion failed; some data may have been deleted",
                    });
                    return;
                }

                if (!deleted) {
                    res.status(404).json({ message: "Workspace not found" });
                    return;
                }

                deleteWorkspaceFiles(filePaths, (error) => {
                    if (error) {
                        console.error("Workspace file cleanup failed:", error);
                        res.status(500).json({
                            message: "Workspace deleted, but file cleanup failed",
                        });
                        return;
                    }

                    res.status(200).json({
                        message: "Workspace deleted successfully",
                    });
                });
            });
        });
    });
}
