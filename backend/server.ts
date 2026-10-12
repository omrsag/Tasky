import express = require("express");
import cors = require("cors");
import mysql = require("mysql2");

// Configuration
const PORT: number = Number(process.env.PORT) || 3001;

const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_USER: string | undefined = process.env.DB_USER;
const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
const DB_NAME: string | undefined = process.env.DB_NAME;
const DB_PORT: number = Number(process.env.DB_PORT) | 3306;

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
const app = express();

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required");
}

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// Routes

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