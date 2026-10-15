import mysql = require("mysql2");

const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_USER: string | undefined = process.env.DB_USER;
const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
const DB_NAME: string | undefined = process.env.DB_NAME;
const DB_PORT: number = Number(process.env.DB_PORT) || 3306;

const db: mysql.Pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
});

export = db;