# Tasky — Development Plan

## Table of Contents

- [Overview](#1-overview)
  - [Working Rules](#working-rules)
- [Implementation Order](#2-implementation-order)

## Milestone Distribution

| Phase | Milestones | Distribution |
|---|---:|---|
| Setup | 1 | █ |
| Database | 1 | █ |
| Backend | 11 | ███████████ |
| Frontend | 10 | ██████████ |
| Integration & Testing | 1 | █ |
| Deployment | 1 | █ |
| README | 1 | █ |
| **Total** | **26** | |

### Setup
- [Milestone 01 — Project Setup](#milestone-01--project-setup)

### Database
- [Milestone 02 — Database Schema](#milestone-02--database-schema)

### Backend Development
- [Milestone 03 — Backend Foundation & Database Connection](#milestone-03--backend-foundation--database-connection)
- [Milestone 04 — Backend Authentication & Sessions](#milestone-04--backend-authentication--sessions)
- [Milestone 05 — Backend Authorization & Workspace Isolation](#milestone-05--backend-authorization--workspace-isolation)
- [Milestone 05A — Backend Modularization & Refactoring](#milestone-05a--backend-modularization--refactoring)
- [Milestone 06 — Backend Workspace & Users](#milestone-06--backend-workspace--users)
- [Milestone 07 — Backend Projects & Project Members](#milestone-07--backend-projects--project-members)
- [Milestone 07A — Backend Project Routes Refactoring](#milestone-07a--backend-project-routes-refactoring)
- [Milestone 08 — Backend Tasks & Workflow](#milestone-08--backend-tasks--workflow)
- [Milestone 09 — Backend Comments, Attachments & Profile Images](#milestone-09--backend-comments-attachments--profile-images)
- [Milestone 10 — Backend Notifications](#milestone-10--backend-notifications)
- [Milestone 11 — Backend Search & Filters](#milestone-11--backend-search--filters)

### Frontend Development
- [Milestone 12 — Frontend Foundation](#milestone-12--frontend-foundation)
- [Milestone 13 — Frontend Authentication Pages](#milestone-13--frontend-authentication-pages)
- [Milestone 14 — Frontend Dashboard](#milestone-14--frontend-dashboard)
- [Milestone 15 — Frontend Workspace & User Management](#milestone-15--frontend-workspace--user-management)
- [Milestone 16 — Frontend Projects & Project Members](#milestone-16--frontend-projects--project-members)
- [Milestone 17 — Frontend Tasks & Workflow](#milestone-17--frontend-tasks--workflow)
- [Milestone 18 — Frontend Comments & Attachments](#milestone-18--frontend-comments--attachments)
- [Milestone 19 — Frontend Notifications](#milestone-19--frontend-notifications)
- [Milestone 20 — Frontend Profile](#milestone-20--frontend-profile)
- [Milestone 21 — Frontend Search, Filters & Responsive UI](#milestone-21--frontend-search-filters--responsive-ui)

### Integration & Testing
- [Milestone 22 — Integration & Manual Acceptance Testing](#milestone-22--integration--manual-acceptance-testing)

### Deployment
- [Milestone 23 — Deployment & Production Verification](#milestone-23--deployment--production-verification)

### Documentation
- [Milestone 24 — README](#milestone-24--readme)

### Final Verification
- [Final Completion Checklist](#final-completion-checklist)

## 1. Overview

This document is the step-by-step implementation plan for the Tasky MVP. It translates the approved product requirements, technology choices, architecture, database design, and API contract into ordered development milestones.

**Source documents:** `PRD.md`, `TECH_STACK.md`, `ARCHITECTURE.md`, `ERD.md`, `ERD.png`, and `API.md`.

### Working Rules

- Complete milestones in order because later work depends on earlier work.
- Use the task checklists to track implementation progress.
- A milestone is complete only when its completion criteria are met.
- Follow the confirmed MVP scope; do not introduce features or libraries that are not needed.
- Keep configuration minimal. Add settings only when required for the chosen stack to work.
- Keep the Express backend modular, with separate application setup, database connection, middleware, and feature-based route files. Do not introduce a backend `src/` directory or unnecessary architectural layers.
- Test backend endpoint groups manually with Postman as they are built. Test frontend pages when they are connected to the backend.
- Use manual testing only; automated tests are outside the MVP scope.
- Do not assign dates, durations, or delivery estimates to milestones.

## 2. Implementation Order

1. **Setup:** Milestone 01.
2. **Database:** Milestone 02.
3. **Backend:** Milestones 03–05, 05A, 06–07, 07A, and 08–11.
4. **Frontend:** Milestones 12–21.
5. **Integration & Manual Testing:** Milestone 22.
6. **Deployment:** Milestone 23.
7. **README:** Milestone 24.

---

## Milestone 01 — Project Setup

**Goal:** Prepare the frontend and backend projects using the confirmed technology stack.

**Dependencies:** None.

### Tasks

- [x] Create the `frontend/` and `backend/` directories in the existing Tasky project.
- [x] Initialize `frontend/` using Create React App with the TypeScript template.
- [x] Install `react-router-dom`, Axios, and Bootstrap for the frontend.
- [x] Initialize `backend/` with npm and TypeScript.
- [x] Install Express, `mysql2`, CORS, Multer, bcrypt, and only the necessary TypeScript type packages.
- [x] Create `backend/server.ts` as the backend entry point; do not create `backend/src/`.
- [x] Create a minimal `backend/tsconfig.json` that compiles the CommonJS backend into `dist/`. Do not add `rootDir`, `extends`, or other options unless needed.
- [x] Create the `backend/uploads/attachments/` and `backend/uploads/profile-images/` directories.
- [x] Prepare the frontend folders `src/pages/`, `src/components/`, and `src/context/` as described in `ARCHITECTURE.md`.
- [x] Verify that the frontend starts and that a minimal backend compiles with `npx tsc` and starts with `node dist/server.js`.

### Completion Criteria

- The frontend runs locally.
- The backend compiles and starts locally.
- The project structure matches the approved architecture without unnecessary configuration.

---

## Milestone 02 — Database Schema

**Goal:** Create the MySQL database structure defined in the ERD.

**Dependencies:** Milestone 01.

### Tasks

- [x] Prepare a local MySQL database and access it through phpMyAdmin.
- [x] Create `database/schema.sql` for repeatable database setup.
- [x] Define the `workspaces` and `users` tables.
- [x] Define the `projects` and `project_members` tables.
- [x] Define the `tasks`, `comments`, and `attachments` tables.
- [x] Define the `notifications` and `sessions` tables.
- [x] Match the ERD's column names, required/optional fields, types, and enum values.
- [x] Add the primary keys and foreign keys defined in `ERD.md`.
- [x] Add unique constraints for user emails, session tokens, and `(project_id, user_id)` memberships.
- [x] Keep application-level deletion coordination in the backend rather than using broad database cascades.
- [x] Import `schema.sql` with phpMyAdmin and verify that all nine tables and relationships are created.

### Completion Criteria

- The complete schema can be created from `database/schema.sql`.
- All nine tables, relationships, and database-level constraints match `ERD.md`.
- The backend will check rules that involve multiple database records.

---

## Milestone 03 — Backend Foundation & Database Connection

**Goal:** Make Express communicate reliably with MySQL and establish shared API behavior.

**Dependencies:** Milestones 01–02.

### Tasks

- [x] Set up Express and JSON request handling inside `backend/server.ts`.
- [x] Read the required port, database settings, and frontend origin from `process.env`.
- [x] Configure CORS to allow the configured `FRONTEND_URL`.
- [x] Create a MySQL connection pool using `mysql2`.
- [x] Use direct, parameterized SQL with callback-based `db.query()`; do not add an ORM or transaction layer.
- [x] Organize `server.ts` internally into configuration, database, helpers, middleware, route groups, file handling, errors, and startup.
- [x] Use `camelCase` in API JSON and `snake_case` for MySQL column names.
- [x] Follow the response and HTTP status conventions in `API.md`, without an `/api` route prefix.
- [x] Handle expected request errors with clear `{ "message": "..." }` responses and unexpected failures without exposing sensitive details.
- [x] Compile and start the backend, then verify the database connection and basic error handling manually.

### Completion Criteria

- The backend starts and can query MySQL.
- API conventions and the backend's simple one-file structure are ready for feature routes.

---

## Milestone 04 — Backend Authentication & Sessions

**Goal:** Implement registration, login, persistent sessions, and password changes.

**Dependencies:** Milestone 03.

### Tasks

- [x] Implement `POST /auth/register` to create one Workspace, its Admin, and a new session.
- [x] Validate registration fields and reject duplicate emails.
- [x] Hash passwords with bcrypt and enforce the minimum eight-character password rule.
- [x] Implement `POST /auth/login` with email/password verification and an Active-account check.
- [x] Generate secure random session tokens using Node.js `crypto` and store them in `sessions`.
- [x] Implement session authentication using `Authorization: Bearer <token>`.
- [x] Implement `GET /auth/me` to validate a session and return the current user, including `hasProfileImage`.
- [x] Implement `POST /auth/logout` to invalidate the current session.
- [x] Implement `PATCH /auth/password` for changing the signed-in user's password.
- [x] Allow multiple active sessions for a user; sessions remain valid until logout or invalidation.
- [x] Reject disabled users on their next protected request, even when their session token still exists.
- [x] Manually test successful and rejected registration, login, logout, password change, and session reuse with Postman.

### Completion Criteria

- Admin registration creates a working Workspace and session.
- Active users can authenticate; invalid sessions and Disabled accounts cannot access protected routes.
- All completed authentication endpoints behave as specified in `API.md`.

---

## Milestone 05 — Backend Authorization & Workspace Isolation

**Goal:** Enforce the Admin, Manager, and Member permission boundaries in the backend.

**Dependencies:** Milestone 04.

### Tasks

- [x] Add reusable authentication and authorization helpers inside `server.ts`.
- [x] Derive the current Workspace from the authenticated user rather than trusting a frontend `workspaceId`.
- [x] Enforce Admin-only operations where required.
- [x] Restrict a Manager's project access to Projects they manage.
- [x] Restrict a Member's project access to Projects they belong to.
- [x] Check object-level permissions for viewing, editing, uploading, and deleting, not just user roles.
- [x] Distinguish unauthenticated, forbidden, nonexistent, and inaccessible requests using the agreed API status conventions.
- [x] Use these helpers in each upcoming protected route group.
- [x] Manually verify with Postman that users cannot access another Workspace or an unauthorized Project.

### Completion Criteria

- Shared authorization checks are available for subsequent API milestones.
- Protected data access is scoped correctly by Workspace, role, and object.

---

## Milestone 05A — Backend Modularization & Refactoring

**Goal:** Improve backend maintainability by separating the existing Express application into small, responsibility-based modules without changing API behavior.

**Dependencies:** Milestone 05.

### Tasks

- [x] Update `ARCHITECTURE.md`, `TECH_STACK.md`, and `PLAN.md` to document the modular backend structure.
- [x] Extract the MySQL connection pool into `backend/db.ts`.
- [x] Extract authentication and role-based authorization middleware into `backend/middleware/auth.ts`.
- [x] Extract Project, Task, Comment, and Attachment permission helpers into `backend/middleware/permissions.ts`.
- [x] Move existing authentication endpoints into `backend/routes/auth.ts`.
- [x] Separate Express application configuration into `backend/app.ts` and keep server startup in `backend/server.ts`.
- [x] Compile the refactored backend and verify existing authentication and authorization behavior with Postman.

### Completion Criteria

- The backend follows the modular structure defined in `ARCHITECTURE.md`.
- Existing API endpoints, HTTP status codes, authentication, and authorization behavior remain unchanged.
- The backend compiles successfully using `npx tsc` and starts using `node dist/server.js`.
- Existing authentication and authorization functionality passes manual verification.
- No additional architectural layers or dependencies are introduced.

---

## Milestone 06 — Backend Workspace & Users

**Goal:** Implement Workspace administration and user account management.

**Dependencies:** Milestone 05A.

### Tasks

- [x] Implement `GET /workspace` for the authenticated Workspace.
- [x] Implement Admin-only `PATCH /workspace` for renaming the Workspace.
- [x] Implement Admin-only `DELETE /workspace` with confirmation handled in the UI later and backend cleanup of Workspace data and uploaded files.
- [x] Implement `GET /users` and `GET /users/:id` with Workspace-scoped visibility.
- [x] Implement Admin-only `POST /users` to create Active Manager and Member accounts with securely hashed passwords.
- [x] Implement Admin-only `PATCH /users/:id` for name, email, role, and Active/Disabled status.
- [x] Implement Admin-only `POST /users/:id/reset-password`.
- [x] Reject duplicate emails and invalid role/status changes.
- [x] Block disabling a Manager who is still responsible for Projects until their Projects are reassigned.
- [x] Prevent role changes that would violate existing Project management, membership, or Task assignment rules.
- [x] Keep user records for historical associations; do not add individual permanent user deletion.
- [x] Test Workspace and user operations, permissions, duplicates, and invalid account transitions with Postman.

### Completion Criteria

- Admin can manage Workspace information and team accounts.
- Account changes preserve the role and history rules from the PRD and ERD.
- Workspace deletion is implemented and will receive a full dependent-data check after all features exist.

---

## Milestone 07 — Backend Projects & Project Members

**Goal:** Implement Project CRUD, Project membership, and Project status rules.

**Dependencies:** Milestone 06.

### Tasks

- [x] Implement `GET /projects` with role-based Project visibility.
- [x] Implement Admin-only `POST /projects` with a required name and exactly one Manager from the same Workspace.
- [x] Set each new Project's status to `Active`; support optional description, start date, and end date.
- [x] Implement `GET /projects/:id` with Project-level access checks.
- [x] Implement `PATCH /projects/:id` for permitted detail changes, Manager reassignment, dates, and status.
- [x] Allow Admin and the responsible Manager to change an Active Project to `Completed` only when all Tasks are `Done`.
- [x] Allow Admin and the responsible Manager to change an Active Project to `Archived`, even if unfinished Tasks remain.
- [x] Enforce Read-only behavior for `Completed` and `Archived` Projects, with Admin-only reactivation to `Active`.
- [x] Implement `GET /projects/:id/members`, `POST /projects/:id/members`, and `DELETE /projects/:id/members/:userId`.
- [x] Allow only valid Members from the Project's Workspace; prevent duplicate memberships.
- [x] Block removal of a Member with unfinished assigned Tasks; retain historical ownership of completed Tasks.
- [x] Implement Admin-only `DELETE /projects/:id` and removal of related records and uploaded files.
- [x] Test roles, Project states, membership constraints, and deletion behavior with Postman.

### Completion Criteria

- Projects have one valid Manager and valid membership.
- Lifecycle, read-only, and membership rules are enforced by the API.
- Project deletion is implemented; full child-data deletion is rechecked in Milestone 22.

---

## Milestone 07A — Backend Project Routes Refactoring

**Goal:** Improve maintainability by splitting the large Project routes file into smaller responsibility-based modules without changing existing API behavior.

**Dependencies:** Milestone 07.

### Tasks

- [x] Review `backend/routes/projects.ts` and identify the Project CRUD, Project Members, and Project deletion responsibilities.
- [x] Extract Project Member endpoints into `backend/routes/project-members.ts`.
- [x] Extract Project deletion and related data/file cleanup into `backend/routes/project-deletion.ts`.
- [x] Keep Project CRUD and lifecycle endpoints in `backend/routes/projects.ts`.
- [x] Update `backend/app.ts` to register the separated route groups.
- [x] Update `ARCHITECTURE.md` to document the new Project route structure.
- [x] Review `TECH_STACK.md`, `API.md`, and other relevant documentation; update only where necessary.
- [x] Preserve existing endpoints, authentication, authorization, validation, business rules, and API responses without introducing additional dependencies or architectural layers.
- [x] Compile the backend using `npx tsc` and verify the existing Project and Project Member endpoints with Postman.

### Completion Criteria

- Project routes are separated into focused, responsibility-based files.
- Existing API endpoints and behavior remain unchanged.
- The modular Express architecture and callback-based SQL approach are preserved.
- The backend compiles successfully and existing Project functionality passes manual verification.

---

## Milestone 08 — Backend Tasks & Workflow

**Goal:** Implement Task operations and the agreed task lifecycle.

**Dependencies:** Milestones 07 and 07A.

### Tasks

- [x] Implement `GET /projects/:id/tasks` so authorized Project users can view its Tasks.
- [x] Implement `POST /projects/:id/tasks` for Admin and responsible Manager in an Active Project.
- [x] Require Task title, priority (`Low`, `Medium`, `High`), and exactly one assignee who is a Member of the same Project.
- [x] Set the initial Task status to `Todo` and support optional description and due date.
- [x] Implement `GET /tasks/:id` with Workspace and Project permission checks.
- [x] Implement `PATCH /tasks/:id` for permitted changes to Task details, assignee, and status.
- [x] Support `Todo`, `In Progress`, `Review`, and `Done` according to the defined role and workflow rules.
- [x] Let Members update only their own assigned Tasks; do not let Members mark Tasks `Done`.
- [x] Allow Admin or the responsible Manager to approve a Task in `Review` as `Done` or return it to `In Progress`.
- [x] Reset a Task to `Todo` when its assignee changes.
- [x] Validate Task due dates against the Project's optional start and end dates, including relevant Project date edits.
- [x] Support identifying overdue Tasks whose due date has passed and whose status is not `Done`.
- [x] Block Task modifications when the Project is `Completed` or `Archived`.
- [x] Implement `DELETE /tasks/:id` for Admin and responsible Manager, including dependent Comments, Attachments, and stored files.
- [x] Test valid and invalid Task assignments, updates, workflow transitions, date rules, and deletion with Postman.

### Completion Criteria

- Authorized users can manage Tasks without breaking ownership, date, status, or Project rules.
- The full Task workflow can be executed through the API.
- Task deletion is implemented; full dependent-file deletion is rechecked in Milestone 22.

---

## Milestone 09 — Backend Comments, Attachments & Profile Images

**Goal:** Implement Task collaboration and protected file handling.

**Dependencies:** Milestone 08.

### Tasks

- [x] Implement `GET /tasks/:id/comments` and `POST /tasks/:id/comments` for users permitted to access the Task.
- [x] Implement `PATCH /comments/:id` so a user can edit only their own Comment.
- [x] Implement `DELETE /comments/:id` for the author, responsible Manager, or Admin, according to their permissions.
- [x] Keep Comment author and Task associations, and show Comments to authorized Project users.
- [x] Configure Multer to store uploaded files under the backend's local `uploads/` folders.
- [x] Implement `GET /tasks/:id/attachments` and `POST /tasks/:id/attachments` using the `file` multipart field.
- [x] Allow attachment uploads only for the Task assignee, responsible Manager, and Admin.
- [x] Enforce the 10 MB per-file attachment limit and support all file types allowed by the PRD.
- [x] Store attachment metadata and paths in MySQL rather than storing file bytes in the database.
- [x] Implement `GET /attachments/:id/download` with authentication and Task permission checks; do not expose uploads as public static files.
- [x] Implement `DELETE /attachments/:id` for the uploader, responsible Manager, or Admin, including filesystem cleanup.
- [x] Implement `GET /auth/profile-image`, `POST /auth/profile-image`, and `DELETE /auth/profile-image` for the signed-in user's own image.
- [x] Return `404` when the user has no profile image and keep the `hasProfileImage` flag consistent.
- [x] Ensure deletion of a Task, Project, or Workspace also handles its stored files and related database records.
- [x] Test Comment permissions, file upload limits, protected downloads, profile image operations, and cleanup with Postman.

### Completion Criteria

- Task Comments and Attachments work within the allowed permissions.
- Uploaded files are protected and can be cleaned up by authorized actions.
- Users can manage only their own profile images.

---

## Milestone 10 — Backend Notifications

**Goal:** Create and expose the five required in-app notification events.

**Dependencies:** Milestones 08–09.

### Tasks

- [x] Create a `TaskAssigned` Notification for the new Task assignee when a Task is assigned or reassigned.
- [x] Create a `TaskSubmittedForReview` Notification for the responsible Manager when a Member submits a Task for Review.
- [x] Create a `TaskApproved` Notification for the assignee when reviewed work is approved as `Done`.
- [x] Create a `TaskReturned` Notification for the assignee when reviewed work returns to `In Progress`.
- [x] Create `NewComment` Notifications for the Task assignee and responsible Manager when a Comment is added.
- [x] Store notification recipient, related Task, type, message, unread state, and creation time.
- [x] Implement `GET /notifications` for the current user's Notifications only.
- [x] Implement `GET /notifications/unread-count`.
- [x] Implement `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`.
- [x] Keep notifications mandatory; do not add preference, email, or opt-out features.
- [x] Confirm that related Task or Workspace deletion removes the required dependent Notifications.
- [x] Test all events, recipient boundaries, unread counts, and read actions with Postman.

### Completion Criteria

- All five notification types are created for the intended recipients.
- Users can retrieve and mark only their own Notifications as read.

---

## Milestone 11 — Backend Search & Filters

**Goal:** Add the simple search and Task filtering defined in the API contract.

**Dependencies:** Milestones 07–08.

### Tasks

- [x] Support the `search` query parameter on `GET /projects`.
- [x] Support the `search` query parameter on `GET /projects/:id/tasks`.
- [x] Support `status`, `priority`, and `assigneeId` Task filters.
- [x] Allow Task search and filter parameters to be combined in the same request.
- [x] Validate filter values and use parameterized SQL queries.
- [x] Apply the same Workspace, role, and Project visibility rules to all search results.
- [x] Test individual filters, combined filters, empty results, and unauthorized search attempts with Postman.

### Completion Criteria

- Project search and Task search/filter requests behave as documented in `API.md`.
- Search cannot expose data outside the user's allowed scope.

---

## Milestone 12 — Frontend Foundation

**Goal:** Build the shared React structure and API connection used by all screens.

**Dependencies:** Milestones 03–05 and 11.

### Tasks

- [x] Set up React Router routes for the required pages.
- [x] Create `AuthContext` as the only global Context needed for the MVP.
- [ ] Store the session token in `localStorage` and configure Axios to send it as a Bearer token.
- [ ] Validate stored sessions through `GET /auth/me` before showing protected pages.
- [ ] Clear invalid local sessions and return unauthenticated users to Login.
- [ ] Create `ProtectedRoute.tsx` to protect authenticated routes.
- [ ] Create shared `Layout.tsx`, `Navbar.tsx`, and simple reusable components as needed.
- [ ] Use Bootstrap for the main UI and simple CSS only where needed.
- [ ] Keep Project, Task, User, and Notification data in page-local React state (`useState` / `useEffect`).
- [ ] Make Axios requests from pages without adding a separate API service layer.
- [ ] Prepare common loading, empty, error, and action-feedback UI patterns.
- [ ] Verify navigation and authenticated API requests in the browser.

### Completion Criteria

- Public and protected routes work.
- Authentication state survives page refresh and browser restart while the server session remains valid.
- Shared frontend components and API handling are ready for feature pages.

---

## Milestone 13 — Frontend Authentication Pages

**Goal:** Allow users to register, sign in, and sign out through the UI.

**Dependencies:** Milestone 12.

### Tasks

- [ ] Build the Registration page with Full Name, Email, Password, and Workspace Name.
- [ ] Connect Registration to `POST /auth/register` and store the returned session token.
- [ ] Build the Login page and connect it to `POST /auth/login`.
- [ ] Update `AuthContext` after successful registration or login and navigate into the application.
- [ ] Add Logout using `POST /auth/logout`, clear the local session, and return to Login.
- [ ] Show clear errors for invalid credentials, duplicate emails, and failed requests.
- [ ] Keep the user on the current page when a recoverable network or server request fails.
- [ ] Verify session restoration and handling of invalidated or Disabled accounts in the browser.

### Completion Criteria

- Registration, login, logout, and persistent login work end to end.
- Authentication errors are understandable and do not leave invalid protected UI visible.

---

## Milestone 14 — Frontend Dashboard

**Goal:** Show a simple post-login summary of relevant Projects and Tasks.

**Dependencies:** Milestone 13.

### Tasks

- [ ] Create the Dashboard page and set it as the landing page after authentication.
- [ ] Load summary information from the existing permitted Project and Task API endpoints.
- [ ] Show relevant Projects and basic Task status/assigned-work information.
- [ ] Respect the different visibility scopes of Admin, Manager, and Member.
- [ ] Provide navigation from Dashboard items to the corresponding Project or Task.
- [ ] Handle loading, no-data, and request-failure states.
- [ ] Check Dashboard behavior with each user role.

### Completion Criteria

- Each role sees a useful, simple summary limited to its permitted data.
- Dashboard navigation and request states work.

---

## Milestone 15 — Frontend Workspace & User Management

**Goal:** Provide the Admin's Workspace and team management screens.

**Dependencies:** Milestones 12–13 and Backend Milestone 06.

### Tasks

- [ ] Create the Workspace management interface.
- [ ] Allow Admin to view the Workspace and change its name.
- [ ] Create a user list and user detail/edit interface for Workspace accounts.
- [ ] Allow Admin to create Manager and Member accounts with name, email, password, and role.
- [ ] Allow Admin to update allowed user fields and set Active/Disabled status.
- [ ] Allow Admin to reset a Manager or Member's password.
- [ ] Show errors when disabling a Manager with assigned Projects or making an invalid role change.
- [ ] Show the required confirmation before Admin deletes the Workspace.
- [ ] Hide unauthorized management actions and rely on the backend to enforce permissions.
- [ ] Refresh affected page data after successful creates, edits, and deletions.
- [ ] Test the Admin and non-Admin experiences in the browser.

### Completion Criteria

- Admin can manage Workspace settings and team accounts through the UI.
- Invalid changes display clear errors, and destructive Workspace deletion requires confirmation.

---

## Milestone 16 — Frontend Projects & Project Members

**Goal:** Provide Project discovery, management, lifecycle, and membership screens.

**Dependencies:** Milestones 12–13 and Backend Milestone 07.

### Tasks

- [ ] Build the Projects list showing only Projects visible to the signed-in user.
- [ ] Build the Project details page with name, description, dates, status, and responsible Manager.
- [ ] Let Admin create a Project and select exactly one eligible Manager.
- [ ] Support permitted Project updates, including Admin Manager reassignment.
- [ ] Show and manage Project Members for Admin and the responsible Manager.
- [ ] Display an error when attempting to remove a Member who still has unfinished Tasks.
- [ ] Support changing an Active Project to `Completed` or `Archived` under the established rules.
- [ ] Allow only Admin to reactivate a Completed or Archived Project.
- [ ] Show Completed and Archived Projects as Read-only and keep Archived Projects outside normal active views.
- [ ] Require confirmation before Admin permanently deletes a Project.
- [ ] Refresh the relevant Project data after successful operations.
- [ ] Test Project visibility and permitted actions for all three roles.

### Completion Criteria

- Project and membership workflows operate through the UI with correct roles and lifecycle restrictions.
- Archived and Completed Projects remain visible where appropriate but cannot be edited until reactivated.

---

## Milestone 17 — Frontend Tasks & Workflow

**Goal:** Build Task views and allow users to complete the full Task workflow.

**Dependencies:** Milestone 16 and Backend Milestone 08.

### Tasks

- [ ] Build the Task list within each Project.
- [ ] Build the Task details interface.
- [ ] Allow Admin and the responsible Manager to create Tasks with required fields and optional details.
- [ ] Allow permitted Task edits, reassignment, and deletion.
- [ ] Show exactly one assignee per Task and present Task priority and due date.
- [ ] Allow Members to change the status only of Tasks assigned to them and never approve a Task as `Done`.
- [ ] Provide Manager/Admin review actions to approve a Task as `Done` or return it to `In Progress`.
- [ ] Reflect the automatic reset to `Todo` after reassignment.
- [ ] Show an Overdue indicator for Tasks whose due date has passed and are not Done.
- [ ] Display clear validation errors for invalid assignees and due dates.
- [ ] Make Tasks in Completed or Archived Projects Read-only.
- [ ] Require confirmation before permanently deleting a Task.
- [ ] Refresh Task details/lists after successful changes and test with all three roles.

### Completion Criteria

- Task creation, assignment, updates, review, and completion work through the browser.
- Task permissions, Overdue indicators, confirmations, and read-only Project restrictions are reflected in the UI.

---

## Milestone 18 — Frontend Comments & Attachments

**Goal:** Expose Task collaboration and protected attachments in Task details.

**Dependencies:** Milestone 17 and Backend Milestone 09.

### Tasks

- [ ] Show Comments for a Task to its authorized Project users.
- [ ] Allow authorized users to add Comments.
- [ ] Allow users to edit their own Comments and delete Comments according to role permissions.
- [ ] Show the Task's existing Attachments.
- [ ] Provide file uploads only for the assignee, responsible Manager, or Admin.
- [ ] Send attachments as `multipart/form-data` with the field name `file`.
- [ ] Support authenticated Attachment downloads through the backend endpoint.
- [ ] Allow permitted users to delete Attachments.
- [ ] Display an understandable error when an Attachment exceeds 10 MB or a request is denied.
- [ ] Keep Task collaboration Read-only for Completed and Archived Projects.
- [ ] Test Comment and Attachment actions in the browser with different roles.

### Completion Criteria

- Authorized users can collaborate and access files through the Task interface.
- Unauthorized file and Comment operations are unavailable in the UI and rejected by the backend.

---

## Milestone 19 — Frontend Notifications

**Goal:** Show in-app Notifications without requiring manual navigation to refresh the unread count.

**Dependencies:** Milestone 12 and Backend Milestone 10.

### Tasks

- [ ] Add an unread Notification count to `Navbar.tsx`.
- [ ] Periodically request `GET /notifications/unread-count` using Axios polling.
- [ ] Build `NotificationsPage.tsx` and load Notifications through `GET /notifications`.
- [ ] Distinguish read and unread Notifications.
- [ ] Allow marking one Notification or all Notifications as read.
- [ ] Provide navigation from a Task-related Notification to its Task when accessible.
- [ ] Keep Notification data scoped to the current user.
- [ ] Handle polling failures, loading, and empty Notification lists.
- [ ] Test each of the five Notification events through the UI.

### Completion Criteria

- Required Notifications appear for their intended users.
- The unread count updates through polling and read actions work.

---

## Milestone 20 — Frontend Profile

**Goal:** Allow signed-in users to maintain the profile actions included in the MVP.

**Dependencies:** Milestone 13 and Backend Milestone 09.

### Tasks

- [ ] Create the Profile page showing the current user's account information.
- [ ] Let users change their own password through `PATCH /auth/password`.
- [ ] Let users upload or replace their own profile picture.
- [ ] Let users remove their own profile picture.
- [ ] Request profile pictures through the protected `/auth/profile-image` endpoint when `hasProfileImage` is true.
- [ ] Display a default avatar when no profile picture exists.
- [ ] Keep other profile fields non-editable by the user, as specified in the PRD.
- [ ] Show clear feedback for successful and failed profile actions.
- [ ] Verify the Profile page using Admin, Manager, and Member accounts.

### Completion Criteria

- Each signed-in user can change their own password and profile picture.
- Private profile images are loaded through authenticated requests.

---

## Milestone 21 — Frontend Search, Filters & Responsive UI

**Goal:** Finish discovery tools and make the MVP usable on desktop and mobile browsers.

**Dependencies:** Milestones 14–20 and Backend Milestone 11.

### Tasks

- [ ] Add Project search to the Projects list through the existing `search` query parameter.
- [ ] Add Task search within the relevant Project Task list.
- [ ] Add Task filters for Status, Priority, and Assigned Member.
- [ ] Support combining the available Task filters and search.
- [ ] Keep search and filters limited to permitted server-side results.
- [ ] Verify loading, empty, success, and error states across all major pages.
- [ ] Ensure failed requests display an error without navigating away from the current page when retry is appropriate.
- [ ] Review layout, navigation, forms, and lists at desktop and mobile sizes.
- [ ] Verify that unavailable actions are hidden or disabled for the current role and Project state.
- [ ] Manually check the core UI in current Chrome, Edge, Firefox, Safari, and Brave.

### Completion Criteria

- Search, filtering, and responsive layouts work without breaking permissions or core workflows.
- Required UI states and the supported browser experience are usable.

---

## Milestone 22 — Integration & Manual Acceptance Testing

**Goal:** Verify the complete Tasky MVP against the PRD's 28 acceptance criteria and critical end-to-end scenarios.

**Dependencies:** Milestones 01–21.

### Tasks — Acceptance Criteria

- [ ] **AC-001:** A visitor registers an Admin account and its Workspace.
- [ ] **AC-002:** Duplicate account emails are rejected.
- [ ] **AC-003:** Login survives refresh/restart and ends at logout or invalidation.
- [ ] **AC-004:** Admin creates Manager and Member accounts that can log in.
- [ ] **AC-005:** Disabled users lose protected access on their next request.
- [ ] **AC-006:** Only Admin creates Projects, each with exactly one Manager.
- [ ] **AC-007:** Admin/Manager manage Project Members while respecting removal rules.
- [ ] **AC-008:** Admin/Manager create valid Tasks assigned to one Project Member, initially `Todo`.
- [ ] **AC-009:** A Member submits work for Review but cannot mark it Done; Manager/Admin completes the review.
- [ ] **AC-010:** Reassignment returns the Task to `Todo`.
- [ ] **AC-011:** Task due dates outside Project date boundaries are rejected.
- [ ] **AC-012:** Overdue appears for past-due, non-Done Tasks without changing Task status.
- [ ] **AC-013:** Every Project Member can see all Tasks in that Project.
- [ ] **AC-014:** Comment author, Manager, and Admin edit/delete rights follow their defined rules.
- [ ] **AC-015:** Attachment upload/download/delete respects permissions and the 10 MB limit.
- [ ] **AC-016:** All required Notification events appear with working Read/Unread states.
- [ ] **AC-017:** Project/Task search and Task filters return only permitted data.
- [ ] **AC-018:** A Project with unfinished Tasks cannot become `Completed`.
- [ ] **AC-019:** A Project with unfinished Tasks can become `Archived`.
- [ ] **AC-020:** Only Admin can reactivate a Completed or Archived Project.
- [ ] **AC-021:** Members with unfinished assigned Tasks cannot be removed before reassignment.
- [ ] **AC-022:** Done Tasks retain historical assignee identity after membership removal.
- [ ] **AC-023:** Managers responsible for Projects cannot be disabled before transferring them.
- [ ] **AC-024:** Project deletion requires confirmation and removes dependent data and files.
- [ ] **AC-025:** Task deletion requires confirmation and removes dependent data and files.
- [ ] **AC-026:** Workspace deletion requires confirmation and removes Workspace data and files.
- [ ] **AC-027:** Failed requests show clear errors and allow retry without losing the current page.
- [ ] **AC-028:** Core flows are usable on supported browsers and desktop/mobile sizes.

### Tasks — End-to-End & Release Checks

- [ ] Execute the full core journey: registration → team accounts → Project → members → Tasks → Review → Done → Project completion.
- [ ] Verify Project archival, Read-only behavior, and Admin reactivation.
- [ ] Verify comments, attachments, Notifications, search, and filters in realistic Task workflows.
- [ ] Verify that a user cannot access another Workspace's records or a Project outside their allowed scope.
- [ ] Verify authorization by sending forbidden requests directly through Postman, not only by checking hidden UI controls.
- [ ] Verify that uploaded files cannot be downloaded without appropriate authentication and authorization.
- [ ] Verify that deleting Tasks, Projects, and Workspaces cleans up related database records and uploaded files.
- [ ] Verify required validation, status codes, error messages, empty states, and request-failure behavior.
- [ ] Fix any critical issues found and repeat the affected manual checks.

### Completion Criteria

- All 28 acceptance criteria pass manual testing.
- All critical end-to-end scenarios work without release-blocking defects.
- The MVP conforms to the confirmed role, security, lifecycle, and data-integrity requirements.

---

## Milestone 23 — Deployment & Production Verification

**Goal:** Publish the working MVP using the agreed free hosting services.

**Dependencies:** Milestone 22.

### Tasks

- [ ] Prepare the Oracle Cloud Always Free VM for the Express backend, MySQL, and local uploaded-file storage.
- [ ] Set up MySQL on the VM and create its schema using `database/schema.sql`.
- [ ] Provide the backend's required configuration and secrets through environment variables.
- [ ] Ensure the backend's upload directories are writable and persist independently of a backend restart.
- [ ] Ensure MySQL and uploaded files are not publicly accessible from the internet.
- [ ] Compile the backend with `npx tsc` and run `node dist/server.js` on the VM.
- [ ] Ensure the Backend keeps running after SSH disconnection and automatically restarts after a VM reboot.
- [ ] Make the backend reachable securely over HTTPS.
- [ ] Configure the frontend's production API URL and deploy the React application to Vercel.
- [ ] Configure backend CORS for the deployed Vercel frontend origin.
- [ ] Verify that direct navigation and page refresh work correctly for all React Router routes on Vercel.
- [ ] Confirm that uploaded files are served only through authenticated backend endpoints.
- [ ] Test registration, login, protected navigation, role permissions, Projects, Tasks, review, and Notifications on the live application.
- [ ] Test uploaded file delivery, Project/Task state changes, and destructive cleanup on the deployed environment.
- [ ] Fix deployment-specific failures and repeat the affected production checks.

### Completion Criteria

- A public Tasky live demo is available and the frontend communicates securely with the deployed backend.
- MySQL and uploaded files work on the VM.
- Critical MVP flows work on the deployed application without critical errors.

---

## Milestone 24 — README

**Goal:** Present Tasky as a full-stack software engineering portfolio project, with a strong emphasis on backend engineering, system design, and technical implementation.

**Dependencies:** Milestone 23.

### Tasks

- [ ] Create the root `README.md` after the live demo is verified.
- [ ] Introduce Tasky as a portfolio project and briefly explain its purpose and core functionality.
- [ ] Highlight the software engineering and backend engineering skills demonstrated by the project.
- [ ] Present the technology stack and high-level system architecture.
- [ ] Explain the backend architecture and REST API design.
- [ ] Describe authentication, session management, role-based authorization, and Workspace isolation.
- [ ] Explain the MySQL database design, relationships, constraints, and data integrity rules.
- [ ] Highlight important business logic, including Task workflows, Project lifecycle rules, and permission enforcement.
- [ ] Explain secure file handling and the in-app notification mechanism.
- [ ] Describe important technical decisions, trade-offs, and intentional MVP limitations.
- [ ] Summarize the manual API and end-to-end verification approach.
- [ ] Provide the project structure and links to the technical documentation.
- [ ] Document local setup instructions, database initialization, and required environment variables without exposing secrets.
- [ ] Include the public live demo link.
- [ ] Verify that all technical explanations accurately reflect the final implementation.

### Completion Criteria

- The README clearly demonstrates the project's software engineering and backend engineering work.
- Technical reviewers can understand the architecture, implementation decisions, and key challenges addressed.
- The documentation accurately represents the implemented MVP and provides working local setup instructions and a live demo link.

---

## Final Completion Checklist

- [ ] All 24 milestones meet their completion criteria.
- [ ] The API, database, and frontend implement the confirmed MVP scope without extra features.
- [ ] All 28 PRD acceptance criteria pass manual verification.
- [ ] The production live demo works without critical issues.
- [ ] The final `README.md` is accurate and complete.
