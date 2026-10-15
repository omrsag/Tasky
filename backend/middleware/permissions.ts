import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

export function requireManagedProject(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  db.query<mysql.RowDataPacket[]>(
    `SELECT id FROM projects
    WHERE id = ? AND manager_id = ? AND workspace_id = ?
    LIMIT 1`,
    [projectId, res.locals.userId, res.locals.workspaceId],
    (error, results) => {
      if (error) {
        console.error("Project access verification failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      next();
    }
  );
}

export function requireMemberProject(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void {
  const projectId = Number(req.params.id);

  if (!Number.isSafeInteger(projectId) || projectId <= 0) {
    res.status(400).json({ message: "Invalid project ID" });
    return;
  }

  db.query<mysql.RowDataPacket[]>(
    `SELECT pm.id
    FROM project_members pm
    JOIN projects p ON p.id = pm.project_id
    WHERE pm.project_id = ?
      AND pm.user_id = ?
      AND p.workspace_id = ?
    LIMIT 1`,
    [projectId, res.locals.userId, res.locals.workspaceId],
    (error, results) => {
      if (error) {
        console.error("Project membership verification failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      next();
    }
  );
}

type TaskAction = "view" | "edit" | "changeStatus" | "upload" | "delete";

export function requireTaskAction(action: TaskAction): express.RequestHandler {
  return (req, res, next) => {
    const taskId = Number(req.params.id);

    if (!Number.isSafeInteger(taskId) || taskId <= 0) {
      res.status(400).json({ message: "Invalid task ID" });
      return;
    }

    db.query<mysql.RowDataPacket[]>(
      `SELECT
        t.id,
        t.assignee_id,
        p.manager_id,
        p.status AS project_status,
        EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = p.id
            AND pm.user_id = ?
        ) AS is_member
      FROM tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = ?
        AND p.workspace_id = ?
      LIMIT 1`,
      [res.locals.userId, taskId, res.locals.workspaceId],
      (error, results) => {
        if (error) {
          console.error("Task permission query failed:", error);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }

        if (results.length === 0) {
          res.status(404).json({ message: "Task not found" });
          return;
        }

        const task = results[0];

        const userId: number = res.locals.userId;
        const role: string = res.locals.role;

        const isAdmin = role === "Admin";

        const isManager =
          role === "Manager" && task.manager_id === userId;

        const isMember =
          role === "Member" && task.is_member === 1;

        if (!isAdmin && !isManager && !isMember) {
          res.status(404).json({ message: "Task not found" });
          return;
        }

        if (action === "view") {
          next();
          return;
        }

        if (task.project_status !== "Active") {
          res.status(400).json({ message: "Project is read-only" });
          return;
        }

        if (action === "edit" || action === "delete") {
          if (!isAdmin && !isManager) {
            res.status(403).json({ message: "Access denied" });
            return;
          }
        }

        if (action === "changeStatus" || action === "upload") {
          const isAssignee = isMember && task.assignee_id === userId;

          if (!isAdmin && !isManager && !isAssignee) {
            res.status(403).json({ message: "Access denied" });
            return;
          }
        }

        next();
      }
    );
  };
}

type CommentAction = "edit" | "delete";

export function requireCommentAction(action: CommentAction): express.RequestHandler {
  return (req, res, next) => {
    const commentId = Number(req.params.id);

    if (!Number.isSafeInteger(commentId) || commentId <= 0) {
      res.status(400).json({ message: "Invalid comment ID" });
      return;
    }

    db.query<mysql.RowDataPacket[]>(
      `SELECT
        c.author_id,
        p.manager_id,
        p.status AS project_status,
        EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = p.id
            AND pm.user_id = ?
        ) AS is_member
      FROM comments c
      JOIN tasks t ON t.id = c.task_id
      JOIN projects p ON p.id = t.project_id
      WHERE c.id = ?
        AND p.workspace_id = ?
      LIMIT 1`,
      [res.locals.userId, commentId, res.locals.workspaceId],
      (error, results) => {
        if (error) {
          console.error("Comment permission query failed:", error);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }

        if (results.length === 0) {
          res.status(404).json({ message: "Comment not found" });
          return;
        }

        const comment = results[0];

        const userId: number = res.locals.userId;
        const role: string = res.locals.role;

        const isAdmin = role === "Admin";

        const isManager =
          role === "Manager" && comment.manager_id === userId;

        const isMember =
          role === "Member" && comment.is_member === 1;

        if (!isAdmin && !isManager && !isMember) {
          res.status(404).json({ message: "Comment not found" });
          return;
        }

        if (comment.project_status !== "Active") {
          res.status(400).json({ message: "Project is read-only" });
          return;
        }

        const isAuthor = comment.author_id === userId;

        if (action === "edit" && !isAuthor) {
          res.status(403).json({ message: "Access denied" });
          return;
        }

        if (action === "delete" && !isAuthor && !isAdmin && !isManager) {
          res.status(403).json({ message: "Access denied" });
          return;
        }

        next();
      }
    );
  };
}

type AttachmentAction = "download" | "delete";

export function requireAttachmentAction(action: AttachmentAction): express.RequestHandler {
  return (req, res, next) => {
    const attachmentId = Number(req.params.id);

    if (!Number.isSafeInteger(attachmentId) || attachmentId <= 0) {
      res.status(400).json({ message: "Invalid attachment ID" });
      return;
    }

    db.query<mysql.RowDataPacket[]>(
      `SELECT
        a.uploader_id,
        p.manager_id,
        p.status AS project_status,
        EXISTS (
          SELECT 1
          FROM project_members pm
          WHERE pm.project_id = p.id
            AND pm.user_id = ?
        ) AS is_member
      FROM attachments a
      JOIN tasks t ON t.id = a.task_id
      JOIN projects p ON p.id = t.project_id
      WHERE a.id = ?
        AND p.workspace_id = ?
      LIMIT 1`,
      [res.locals.userId, attachmentId, res.locals.workspaceId],
      (error, results) => {
        if (error) {
          console.error("Attachment permission query failed:", error);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }

        if (results.length === 0) {
          res.status(404).json({ message: "Attachment not found" });
          return;
        }

        const attachment = results[0];

        const userId: number = res.locals.userId;
        const role: string = res.locals.role;

        const isAdmin = role === "Admin";

        const isManager =
          role === "Manager" && attachment.manager_id === userId;

        const isMember =
          role === "Member" && attachment.is_member === 1;

        if (!isAdmin && !isManager && !isMember) {
          res.status(404).json({ message: "Attachment not found" });
          return;
        }

        if (action === "download") {
          next();
          return;
        }

        if (attachment.project_status !== "Active") {
          res.status(400).json({ message: "Project is read-only" });
          return;
        }

        const isUploader = attachment.uploader_id === userId;

        if (!isAdmin && !isManager && !isUploader) {
          res.status(403).json({ message: "Access denied" });
          return;
        }

        next();
      }
    );
  };
}