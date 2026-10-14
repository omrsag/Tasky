import express = require("express");
import cors = require("cors");
import mysql = require("mysql2");
import bcrypt = require("bcrypt");
import crypto = require("crypto");

// Configuration
const PORT: number = Number(process.env.PORT) || 3001;

const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_USER: string | undefined = process.env.DB_USER;
const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
const DB_NAME: string | undefined = process.env.DB_NAME;
const DB_PORT: number = Number(process.env.DB_PORT) || 3306;

const FRONTEND_URL: string | undefined = process.env.FRONTEND_URL;

// Database
const db: mysql.Pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
});

// Helpers

// Middleware
function requireAuth(
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

function requireRole(...allowedRoles: string[]): express.RequestHandler {
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

const requireAdmin: express.RequestHandler = requireRole("Admin");

function requireManagedProject(
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

function requireMemberProject(
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

function requireTaskAction(action: TaskAction): express.RequestHandler {
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

function requireCommentAction(action: CommentAction): express.RequestHandler {
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

function requireAttachmentAction(action: AttachmentAction): express.RequestHandler {
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

const app = express();

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required");
}

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.use(
  [
    "/workspace",
    "/users",
    "/projects",
    "/tasks",
    "/comments",
    "/attachments",
    "/notifications",
    "/auth/profile-image",
  ],
  requireAuth
);

// Routes
app.post("/auth/register", (req: express.Request, res: express.Response) => {
  const { fullName, email, password, workspaceName } = req.body ?? {};

  const emailParts = typeof email === "string" ? email.trim().split("@") : [];

  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1].includes(".") ||
    email.trim().includes(" ") ||
    typeof password !== "string" ||
    password.length < 8 ||
    typeof workspaceName !== "string" ||
    !workspaceName.trim()
  ) {
    res.status(400).json({ message: "Invalid registration information" });
    return;
  }

  const normalizedEmail: string = email.trim().toLowerCase();

  db.query<mysql.RowDataPacket[]>(
    "SELECT id FROM users WHERE email = ? LIMIT 1",
    [normalizedEmail],
    (error, results) => {
      if (error) {
        console.error("Registration query failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length > 0) {
        res.status(409).json({ message: "Email already exists" });
        return;
      }


      bcrypt.hash(password, 10, (hashError, passwordHash) => {
        if (hashError) {
          console.error("Password hashing failed:", hashError);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }


        db.query<mysql.ResultSetHeader>(
          "INSERT INTO workspaces (name) VALUES (?)",
          [workspaceName.trim()],
          (workspaceError, workspaceResult) => {
            if (workspaceError) {
              console.error("Workspace creation failed:", workspaceError);
              res.status(500).json({ message: "Something went wrong" });
              return;
            }

            const workspaceId: number = workspaceResult.insertId;


            db.query<mysql.ResultSetHeader>(
              `INSERT INTO users (workspace_id, full_name, email, password_hash, role, status)
              VALUES (?, ?, ?, ?, ?, ?)`,
              [workspaceId, fullName.trim(), normalizedEmail, passwordHash, "Admin", "Active"],
              (adminError, adminResult) => {
                if (adminError) {
                  console.error("Admin creation failed:", adminError);

                  db.query(
                    "DELETE FROM workspaces WHERE id = ?",
                    [workspaceId],
                    (cleanupError) => {
                      if (cleanupError) {
                        console.error("Workspace cleanup failed:", cleanupError);
                      }

                      const duplicateEmail = adminError.code === "ER_DUP_ENTRY";

                      res.status(duplicateEmail ? 409 : 500).json({
                        message: duplicateEmail
                          ? "Email already exists"
                          : "Something went wrong",
                      });
                    }
                  );
                  return;
                }

                const adminId: number = adminResult.insertId;


                const token: string = crypto.randomBytes(32).toString("hex");

                db.query<mysql.ResultSetHeader>(
                  "INSERT INTO sessions (user_id, token) VALUES (?, ?)",
                  [adminId, token],
                  (sessionError) => {
                    if (sessionError) {
                      console.error("Session creation failed:", sessionError);

                      db.query(
                        "DELETE FROM users WHERE id = ?",
                        [adminId],
                        (adminCleanupError) => {
                          if (adminCleanupError) {
                            console.error("Admin cleanup failed:", adminCleanupError);
                            res.status(500).json({ message: "Something went wrong" });
                            return;
                          }

                          db.query(
                            "DELETE FROM workspaces WHERE id = ?",
                            [workspaceId],
                            (workspaceCleanupError) => {
                              if (workspaceCleanupError) {
                                console.error("Workspace cleanup failed:", workspaceCleanupError);
                              }

                              res.status(500).json({ message: "Something went wrong" });
                            }
                          );
                        }
                      );
                      return;
                    }

                    res.status(201).json({
                      token,
                      user: {
                        id: adminId,
                        fullName: fullName.trim(),
                        email: normalizedEmail,
                        role: "Admin",
                        hasProfileImage: false,
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
  );
});

app.post("/auth/login", (req: express.Request, res: express.Response) => {
  const { email, password } = req.body ?? {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof password !== "string" ||
    !password
  ) {
    res.status(400).json({ message: "Invalid login information" });
    return;
  }

  const normalizedEmail: string = email.trim().toLowerCase();

  db.query<mysql.RowDataPacket[]>(
    `SELECT id, full_name, email, password_hash, role, status, profile_image_path
    FROM users
    WHERE email = ?
    LIMIT 1`,
    [normalizedEmail],
    (error, results) => {
      if (error) {
        console.error("Login query failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: "Invalid email or password" });
        return;
      }

      const user = results[0];

      bcrypt.compare(password, user.password_hash, (compareError, isMatch) => {
        if (compareError) {
          console.error("Password verification failed:", compareError);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }

        if (!isMatch) {
          res.status(401).json({ message: "Invalid email or password" });
          return;
        }

        if (user.status !== "Active") {
          res.status(403).json({ message: "Account is disabled" });
          return;
        }

        const token: string = crypto.randomBytes(32).toString("hex");

        db.query<mysql.ResultSetHeader>(
          "INSERT INTO sessions (user_id, token) VALUES (?, ?)",
          [user.id, token],
          (sessionError) => {
            if (sessionError) {
              console.error("Login session creation failed:", sessionError);
              res.status(500).json({ message: "Something went wrong" });
              return;
            }

            res.status(200).json({
              token,
              user: {
                id: user.id,
                fullName: user.full_name,
                email: user.email,
                role: user.role,
                hasProfileImage: user.profile_image_path !== null,
              },
            });
          }
        );
      });
    }
  );
});

app.get("/auth/me", requireAuth, (_req: express.Request, res: express.Response) => {
  const userId: number = res.locals.userId;

  db.query<mysql.RowDataPacket[]>(
    `SELECT id, full_name, email, role, profile_image_path
    FROM users
    WHERE id = ?
    LIMIT 1`,
    [userId],
    (error, results) => {
      if (error) {
        console.error("Fetch current user failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: "Invalid session" });
        return;
      }

      const user = results[0];

      res.status(200).json({
        user: {
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          role: user.role,
          hasProfileImage: user.profile_image_path !== null,
        },
      });
    }
  );
});

app.post("/auth/logout", requireAuth, (_req: express.Request, res: express.Response) => {
  const token: string = res.locals.token;

  db.query<mysql.ResultSetHeader>(
    "DELETE FROM sessions WHERE token = ?",
    [token],
    (error) => {
      if (error) {
        console.error("Logout failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      res.status(200).json({ message: "Logged out successfully" });
    }
  );
});

app.patch("/auth/password", requireAuth, (req: express.Request, res: express.Response) => {
  const { currentPassword, newPassword } = req.body ?? {};

  if (
    typeof currentPassword !== "string" ||
    !currentPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    res.status(400).json({ message: "Invalid password information" });
    return;
  }

  const userId: number = res.locals.userId;

  db.query<mysql.RowDataPacket[]>(
    "SELECT password_hash FROM users WHERE id = ? LIMIT 1",
    [userId],
    (error, results) => {
      if (error) {
        console.error("Password query failed:", error);
        res.status(500).json({ message: "Something went wrong" });
        return;
      }

      if (results.length === 0) {
        res.status(401).json({ message: "Invalid session" });
        return;
      }

      const passwordHash: string = results[0].password_hash;


      bcrypt.compare(currentPassword, passwordHash, (compareError, isMatch) => {
        if (compareError) {
          console.error("Current password verification failed:", compareError);
          res.status(500).json({ message: "Something went wrong" });
          return;
        }

        if (!isMatch) {
          res.status(400).json({ message: "Current password is incorrect" });
          return;
        }
        bcrypt.hash(newPassword, 10, (hashError, newPasswordHash) => {
          if (hashError) {
            console.error("New password hashing failed:", hashError);
            res.status(500).json({ message: "Something went wrong" });
            return;
          }

          db.query<mysql.ResultSetHeader>(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            [newPasswordHash, userId],
            (updateError) => {
              if (updateError) {
                console.error("Password update failed:", updateError);
                res.status(500).json({ message: "Something went wrong" });
                return;
              }

              res.status(200).json({ message: "Password changed successfully" });
            }
          );
        });
      });
    }
  );
});

// File Handling

// Error Handling
app.use((_req: express.Request, res: express.Response) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((
  error: Error & { status?: number },
  _req: express.Request,
  res: express.Response,
  _next: express.NextFunction
) => {
  if (error.status === 400) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  console.error("Unexpected server error:", error);
  res.status(500).json({ message: "Something went wrong" });
});

// Server Startup
app.listen(PORT, () => {
  console.log(`Tasky backend running on port ${PORT}`);
});