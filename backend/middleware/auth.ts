import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

export function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const authHeader = req.headers.authorization;

  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";

  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  db.query<mysql.RowDataPacket[]>(
    `SELECT s.user_id, u.status, u.role, u.workspace_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ?
    LIMIT 1`,
    [token],
    (error, results) => {
      if (error) {
        console.error("Session validation failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: "Invalid session" });
        return;
      }

      if (results[0].status !== "Active") {
        res.status(403).json({ message: "Account is disabled" });
        return;
      }

      res.locals.userId = results[0].user_id;
      res.locals.role = results[0].role;
      res.locals.workspaceId = results[0].workspace_id;
      res.locals.token = token;
      next();
    }
  );
}

export function requireRole(...allowedRoles: string[]): express.RequestHandler {
  return (_req, res, next) => {
    if (!res.locals.userId) {
      res.status(401).json({ message: "Authentication required" });
      return;
    }

    if (allowedRoles.indexOf(res.locals.role) === -1) {
      res.status(403).json({ message: "Access denied" });
      return;
    }

    next();
  };
}

export const requireAdmin: express.RequestHandler = requireRole("Admin");