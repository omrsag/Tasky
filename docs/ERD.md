# Tasky — Entity Relationship Diagram

## 1. Overview

This document defines the relational database structure for the Tasky MVP.

Tasky uses MySQL with direct SQL queries from the Express backend. The database stores application data, authentication sessions, and file references, while uploaded files themselves remain in local backend storage.

The schema is intentionally simple and limited to the confirmed MVP scope.

## 2. Core Tables

Tasky uses the following tables:

- `workspaces`
- `users`
- `projects`
- `project_members`
- `tasks`
- `comments`
- `attachments`
- `notifications`
- `sessions`

All tables use:

```text
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

## 3. Table Definitions

### 3.1 `workspaces`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `name` | VARCHAR(255) | Required |

A Workspace contains many Users and Projects.

### 3.2 `users`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `workspace_id` | BIGINT UNSIGNED | FK → `workspaces.id`, required |
| `full_name` | VARCHAR(255) | Required |
| `email` | VARCHAR(255) | Required, unique |
| `password_hash` | VARCHAR(255) | Required |
| `role` | ENUM | `Admin`, `Manager`, `Member` |
| `status` | ENUM | `Active`, `Disabled` |
| `profile_image_path` | VARCHAR(500) | Optional |

Each User belongs to exactly one Workspace.

### 3.3 `projects`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `workspace_id` | BIGINT UNSIGNED | FK → `workspaces.id`, required |
| `manager_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `name` | VARCHAR(255) | Required |
| `description` | TEXT | Optional |
| `start_date` | DATE | Optional |
| `end_date` | DATE | Optional |
| `status` | ENUM | `Active`, `Completed`, `Archived` |
| `created_at` | TIMESTAMP | Defaults to current timestamp |

Each Project belongs to one Workspace and has exactly one responsible Manager.

### 3.4 `project_members`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `project_id` | BIGINT UNSIGNED | FK → `projects.id`, required |
| `user_id` | BIGINT UNSIGNED | FK → `users.id`, required |

This table represents the many-to-many relationship between Projects and their Members.

### 3.5 `tasks`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `project_id` | BIGINT UNSIGNED | FK → `projects.id`, required |
| `assignee_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `title` | VARCHAR(255) | Required |
| `description` | TEXT | Optional |
| `priority` | ENUM | `Low`, `Medium`, `High` |
| `status` | ENUM | `Todo`, `In Progress`, `Review`, `Done` |
| `due_date` | DATE | Optional |
| `created_at` | TIMESTAMP | Defaults to current timestamp |

Each Task belongs to one Project and is assigned to exactly one Member.

### 3.6 `comments`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `task_id` | BIGINT UNSIGNED | FK → `tasks.id`, required |
| `author_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `content` | TEXT | Required |
| `created_at` | TIMESTAMP | Defaults to current timestamp |

Each Comment belongs to one Task and keeps its author association.

### 3.7 `attachments`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `task_id` | BIGINT UNSIGNED | FK → `tasks.id`, required |
| `uploader_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `file_name` | VARCHAR(255) | Required |
| `file_path` | VARCHAR(500) | Required |
| `created_at` | TIMESTAMP | Defaults to current timestamp |

The database stores only file metadata and the local file path. The actual uploaded file is stored by the backend.

### 3.8 `notifications`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `recipient_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `task_id` | BIGINT UNSIGNED | FK → `tasks.id`, required |
| `type` | ENUM | Notification event type |
| `message` | TEXT | Required |
| `is_read` | BOOLEAN | Required, defaults to `FALSE` |
| `created_at` | TIMESTAMP | Defaults to current timestamp |

`type` supports:

- `TaskAssigned`
- `TaskSubmittedForReview`
- `TaskApproved`
- `TaskReturned`
- `NewComment`

### 3.9 `sessions`

| Column | Type | Rules |
|---|---|---|
| `id` | BIGINT UNSIGNED | Primary key, auto increment |
| `user_id` | BIGINT UNSIGNED | FK → `users.id`, required |
| `token` | VARCHAR(255) | Required, unique |

A User may have multiple active Sessions at the same time. Sessions remain valid until logout or invalidation.

## 4. Main Relationships

```text
Workspace 1 ─── N Users
Workspace 1 ─── N Projects
Manager   1 ─── N Projects

Project   N ─── N Members   through project_members
Project   1 ─── N Tasks
Member    1 ─── N Tasks     as assignee

Task      1 ─── N Comments
User      1 ─── N Comments  as author

Task      1 ─── N Attachments
User      1 ─── N Attachments as uploader

Task      1 ─── N Notifications
User      1 ─── N Notifications as recipient

User      1 ─── N Sessions
```

## 5. Constraints & Integrity Rules

- `users.email` is `UNIQUE` because each email address can belong to only one Tasky account.
- `sessions.token` is `UNIQUE` so that each authentication token identifies only one Session.
- `project_members (project_id, user_id)` is `UNIQUE` to prevent the same user from being added to the same Project more than once, including accidental duplicate requests from the frontend or backend.
- `projects.manager_id` must reference a User with the `Manager` role in the same Workspace.
- `project_members.user_id` must reference a User with the `Member` role in the same Workspace as the Project.
- `tasks.assignee_id` must reference a Member who already belongs to the same Project.
- Each Workspace must have exactly one User with the `Admin` role.
- A Project may be marked `Completed` only when all of its Tasks are `Done`.
- Reassigning a Task must reset its status to `Todo`.
- A Task Due Date must respect the Project Start Date and End Date when those dates exist.
- Removing a User from `project_members` does not delete the User or their completed Tasks. Historical Task ownership remains through `tasks.assignee_id`.

Rules that depend on roles, workflow state, or multiple records are enforced by the Express backend in addition to database foreign keys.

## 6. Deletion Behavior

Tasky does not rely on broad database cascade behavior for application-level destructive actions.

The backend is responsible for coordinating required deletions:

- Deleting a Task removes its Comments, Attachments, and associated uploaded files.
- Deleting a Project removes its Tasks and their dependent data and uploaded files.
- Deleting a Workspace removes all Workspace data and uploaded files.
- Individual Users are not permanently deleted in the MVP; they are disabled so historical associations remain available.

## 7. File Storage Note

Profile images and Task attachments are stored on the backend filesystem rather than inside MySQL.

MySQL stores only file references such as `profile_image_path` and `attachments.file_path`.
