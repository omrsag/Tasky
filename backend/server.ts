import express = require("express");
import cors = require("cors");
import mysql = require("mysql2");

// Configuration
const PORT: number = Number(process.env.PORT) || 3001;

const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_USER: string | undefined = process.env.DB_USER;
const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
const DB_NAME: string | undefined = process.env.DB_NAME;

const FRONTEND_URL: string | undefined = process.env.FRONTEND_URL;

// Database
const db: mysql.Pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

db.query<mysql.RowDataPacket[]>(
  "SELECT id FROM workspaces WHERE name = ? LIMIT 1",
  ["Tasky"],
  (error, results) => {
    if (error) {
      console.error("Database query failed:", error.message);
      return;
    }

    console.log("Database query executed successfully");
  }
);

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

// Server Startup
app.listen(PORT, () => {
  console.log(`Tasky backend running on port ${PORT}`);
});