import express = require("express");
import cors = require("cors");
import { requireAuth } from "./middleware/auth";
import { registerAuthRoutes } from "./routes/auth";
import { registerWorkspaceRoutes } from "./routes/workspace";
import { registerUsersRoutes } from "./routes/users";
import { registerProjectRoutes } from "./routes/projects";
import { registerProjectMemberRoutes } from "./routes/project-members";
import { registerProjectDeletionRoutes } from "./routes/project-deletion";
import { registerTaskRoutes } from "./routes/tasks";
import { registerCommentRoutes } from "./routes/comments";
import { registerAttachmentRoutes } from "./routes/attachments";
import { registerProfileImageRoutes } from "./routes/profile-images";
import { registerNotificationRoutes } from "./routes/notifications";

const FRONTEND_URL: string | undefined = process.env.FRONTEND_URL;

export const app = express();

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
registerAuthRoutes(app);
registerWorkspaceRoutes(app);
registerUsersRoutes(app);
registerProjectRoutes(app);
registerProjectMemberRoutes(app);
registerProjectDeletionRoutes(app);
registerTaskRoutes(app);
registerCommentRoutes(app);
registerNotificationRoutes(app);
registerAttachmentRoutes(app);
registerProfileImageRoutes(app);

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