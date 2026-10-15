import { app } from "./app";

// Configuration
const PORT: number = Number(process.env.PORT) || 3001;

// Server Startup
app.listen(PORT, () => {
  console.log(`Tasky backend running on port ${PORT}`);
});