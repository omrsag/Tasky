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
    "SELECT user_id FROM sessions WHERE token = ? LIMIT 1",
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

      res.locals.userId = results[0].user_id;
      next();
    }
  );
}

const app = express();

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required");
}

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

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