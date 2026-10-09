# Tasky — REST API

## 1. Overview

Tasky exposes a REST API through the Express backend. The React frontend communicates with it using Axios, while the backend handles authentication, authorization, validation, business rules, MySQL access, and protected file delivery.

API routes do not use an `/api` prefix.

## 2. General Conventions

### Authentication
Protected requests send the session token with:

```http
Authorization: Bearer <token>
```

The token is a server-side session token, not a JWT.

### JSON naming
API request and response fields use `camelCase`; MySQL columns remain `snake_case` internally.

```json
{
  "assigneeId": 7,
  "dueDate": "2026-10-20"
}
```

### Response format
JSON responses use descriptive resource keys:

```json
{ "project": {} }
```

```json
{ "projects": [] }
```

Operation results and errors use a clear message:

```json
{ "message": "Task deleted successfully" }
```

```json
{ "message": "Project not found" }
```

File-delivery endpoints return the requested file directly rather than wrapping it in JSON. Error responses from those endpoints still use the normal JSON message format.
No global `success`, `data`, or custom error-code wrapper is required.

## 3. HTTP Status Codes

| Code | Usage |
|---|---|
| `200 OK` | Successful read, update, delete, or normal action |
| `201 Created` | Resource created successfully |
| `400 Bad Request` | Invalid input or business-rule violation |
| `401 Unauthorized` | Missing or invalid session |
| `403 Forbidden` | Authenticated user lacks permission |
| `404 Not Found` | Resource does not exist or is not accessible |
| `409 Conflict` | Conflict such as duplicate email |
| `413 Payload Too Large` | Uploaded file exceeds the allowed size |
| `500 Internal Server Error` | Unexpected server error |

## 4. Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Create a new Admin, Workspace, and session |
| `POST` | `/auth/login` | Authenticate and create a session |
| `POST` | `/auth/logout` | Invalidate the current session |
| `GET` | `/auth/me` | Validate the session and return the current user |
| `PATCH` | `/auth/password` | Change the current user's password |
| `GET` | `/auth/profile-image` | Return the current user's profile image after authentication |
| `POST` | `/auth/profile-image` | Upload or replace the current profile image |
| `DELETE` | `/auth/profile-image` | Remove the current profile image |

Example login response:

```json
{
  "token": "abc123...",
  "user": {
    "id": 1,
    "fullName": "Omar Saghir",
    "email": "omar@example.com",
    "role": "Admin",
    "hasProfileImage": true
  }
}
```

The `user` object returned by both `POST /auth/login` and `GET /auth/me` includes `hasProfileImage`, which indicates whether the user currently has a profile image.
Profile images are not exposed as public files. When `hasProfileImage` is `true`, the frontend may request `GET /auth/profile-image` using the authenticated session. The endpoint returns the image file after authentication. If no profile image exists, the frontend displays a default avatar.
`GET /auth/profile-image` returns the image file directly with the appropriate `Content-Type` after authentication. If the current user has no profile image, the endpoint returns `404 Not Found` with a JSON error message.

## 5. Workspace

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/workspace` | Return the current Workspace |
| `PATCH` | `/workspace` | Rename the current Workspace |
| `DELETE` | `/workspace` | Permanently delete the Workspace and related data |

The Workspace is derived from the authenticated user; the frontend does not provide a trusted `workspaceId` for protected operations.

## 6. Users

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/users` | List users in the current Workspace |
| `POST` | `/users` | Admin creates a Manager or Member |
| `GET` | `/users/:id` | Return one Workspace user |
| `PATCH` | `/users/:id` | Admin updates name, email, role, or status |
| `POST` | `/users/:id/reset-password` | Admin sets a new password for a Manager or Member |

Individual users are disabled rather than permanently deleted in the MVP.

## 7. Projects

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/projects` | List Projects visible to the current user |
| `POST` | `/projects` | Admin creates a Project |
| `GET` | `/projects/:id` | Return one Project |
| `PATCH` | `/projects/:id` | Update details, Manager, dates, or status |
| `DELETE` | `/projects/:id` | Admin permanently deletes a Project |

Project status changes use the normal update endpoint:

```json
{ "status": "Completed" }
```

The backend validates all Project status rules before applying the change.

### Project Members

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/projects/:id/members` | List Project Members |
| `POST` | `/projects/:id/members` | Add a Member |
| `DELETE` | `/projects/:id/members/:userId` | Remove a Member |

Removal is blocked while the Member has unfinished assigned Tasks.

## 8. Tasks

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/projects/:id/tasks` | List Tasks in a Project |
| `POST` | `/projects/:id/tasks` | Create a Task in an Active Project |
| `GET` | `/tasks/:id` | Return one Task |
| `PATCH` | `/tasks/:id` | Update details, assignee, or status |
| `DELETE` | `/tasks/:id` | Permanently delete a Task |

Example create request:

```json
{
  "title": "Build dashboard",
  "description": "Create the main dashboard page",
  "priority": "High",
  "assigneeId": 7,
  "dueDate": "2026-10-20"
}
```

New Tasks start with `Todo`. Status updates also use `PATCH /tasks/:id`:

```json
{ "status": "Review" }
```

Changing `assigneeId` automatically resets the Task to `Todo`.

## 9. Comments

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/tasks/:id/comments` | List Task Comments |
| `POST` | `/tasks/:id/comments` | Add a Comment |
| `PATCH` | `/comments/:id` | Edit the current user's Comment |
| `DELETE` | `/comments/:id` | Delete a Comment when permitted |

Comment edit and delete permissions are enforced by the backend.

## 10. Attachments

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/tasks/:id/attachments` | List Task Attachments |
| `POST` | `/tasks/:id/attachments` | Upload a Task Attachment |
| `GET` | `/attachments/:id/download` | Download an Attachment after permission checks |
| `DELETE` | `/attachments/:id` | Delete an Attachment when permitted |

Uploads use `multipart/form-data` with a file field named `file`. Maximum size is `10 MB` per attachment.

Uploaded files are not public static files. Downloads pass through the backend so authentication and permissions can be checked first.

## 11. Notifications

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/notifications` | List Notifications for the current user |
| `GET` | `/notifications/unread-count` | Return the unread count |
| `PATCH` | `/notifications/:id/read` | Mark one Notification as read |
| `PATCH` | `/notifications/read-all` | Mark all current user's Notifications as read |

Notification types are `TaskAssigned`, `TaskSubmittedForReview`, `TaskApproved`, `TaskReturned`, and `NewComment`.

The frontend polls the unread-count endpoint periodically. Opening a Notification may mark that Notification as read and navigate to its related Task.

## 12. Search and Filters

Search and filtering use query parameters rather than separate endpoints.

Projects:

```http
GET /projects?search=website
```

Tasks:

```http
GET /projects/5/tasks?search=dashboard
GET /projects/5/tasks?status=Review
GET /projects/5/tasks?priority=High
GET /projects/5/tasks?assigneeId=7
```

Parameters may be combined:

```http
GET /projects/5/tasks?search=dashboard&status=Review&priority=High&assigneeId=7
```

Search results always respect the authenticated user's visibility permissions.

## 13. Authorization & Business Rules

The frontend may hide unavailable actions, but the backend is the final authority for all protected requests.

- Every protected request requires a valid session belonging to an `Active` user.
- Workspace access is limited to the authenticated user's Workspace.
- Admin can access all permitted Workspace data.
- Manager access is limited to Projects they manage.
- Member access is limited to Projects they belong to.
- Only Admin creates Projects, and each Project has exactly one Manager.
- Only valid Project Members may be assigned Tasks.
- Members may update only their assigned Tasks and cannot mark them `Done`.
- A Project becomes `Completed` only when all Tasks are `Done`.
- Completed and Archived Projects are read-only until Admin reactivates them.
- Task Due Dates must respect Project date boundaries when present.
- Removing a Member with unfinished Tasks is blocked.
- Disabling a Manager who still owns Projects is blocked.
- Destructive actions remove required dependent records and uploaded files.

## 14. Error Handling

Expected failures return a clear message with the appropriate HTTP status:

```json
{ "message": "You do not have permission to edit this task" }
```

Unexpected server errors return:

```json
{ "message": "Something went wrong" }
```

When a request fails, the frontend keeps the user on the current screen and allows retry where appropriate.
