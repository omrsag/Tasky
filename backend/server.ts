import express = require("express");
import cors = require("cors");

const PORT: number = Number(process.env.PORT) || 3001;

const DB_HOST: string | undefined = process.env.DB_HOST;
const DB_USER: string | undefined = process.env.DB_USER;
const DB_PASSWORD: string | undefined = process.env.DB_PASSWORD;
const DB_NAME: string | undefined = process.env.DB_NAME;

const FRONTEND_URL: string | undefined = process.env.FRONTEND_URL;

const app = express();

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is required");
}

app.use(cors({ origin: FRONTEND_URL }));

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Tasky backend running on port ${PORT}`);
});