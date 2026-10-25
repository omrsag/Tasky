# Tasky

**Tasky** is a web-based project and task management application designed to help small teams organize projects, assign tasks, track progress, and collaborate efficiently.

The project is being developed as a full-stack portfolio application, with a focus on backend development, REST API design, authentication, authorization, relational databases, and business logic.

## Project Status

- **Backend:** Completed for the planned MVP and manually tested using Postman.
- **Database:** MySQL schema implemented.
- **Frontend:** In development using React and TypeScript.
- **Deployment:** Planned after frontend integration.

The backend is currently the main completed component of the project.

## Key Features

### Authentication & Authorization
- User registration and login.
- Password hashing using bcrypt.
- Server-side session-based authentication.
- Role-based access control (Admin, Manager, Member).
- Workspace isolation and protected API endpoints.

### Project & Task Management
- Project creation, updates, and deletion.
- Project membership and manager assignment.
- Project lifecycle: Active, Completed, and Archived.
- Task creation, assignment, reassignment, and deletion.
- Task workflow: Todo → In Progress → Review → Done.
- Task priorities, due dates, and overdue detection.
- Role-specific permissions and workflow validation.

### Collaboration
- Task comments.
- File attachments with protected downloads.
- User profile image management.
- In-app notifications for task assignments, reviews, approvals, returns, and comments.

### Search & Filtering
- Project search by name and description.
- Task search by title and description.
- Task filtering by status, priority, and assignee.
- Combined search and filtering with permission checks.

## Tech Stack

| Category | Technologies |
|---|---|
| Backend | Node.js, Express.js, TypeScript |
| Database | MySQL, mysql2 |
| Authentication | Server-side Sessions, bcrypt |
| File Uploads | Multer |
| Frontend (In Progress) | React, TypeScript, Axios, Bootstrap |
| Development Tools | Git, GitHub, Postman, npm |

## Architecture

Tasky uses a separated frontend and backend architecture.

**React Frontend → Express REST API → MySQL Database**

The backend follows a modular structure, separating application configuration, database connectivity, authentication middleware, authorization helpers, and feature-based API routes.

Database operations use direct, parameterized SQL queries through `mysql2`.

## Project Structure

```text
Tasky/
├── backend/
│   ├── middleware/
│   ├── routes/
│   ├── uploads/
│   ├── app.ts
│   ├── db.ts
│   └── server.ts
├── database/
│   └── schema.sql
├── docs/
├── frontend/
└── README.md
```

## Running the Backend Locally

### Prerequisites

- Node.js and npm
- MySQL

### 1. Set Up the Database

Create a MySQL database named `tasky`:

```sql
CREATE DATABASE tasky;
```

Then import the schema from `database/schema.sql`.

For example, using the MySQL command-line client from the project root:

```bash
mysql -u root -p tasky < database/schema.sql
```

### 2. Configure Environment Variables

The backend reads its configuration from environment variables:

| Variable | Description |
|---|---|
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name (`tasky`) |
| `DB_PORT` | MySQL port (default: 3306) |
| `FRONTEND_URL` | Allowed frontend origin for CORS |
| `PORT` | Backend port (default: 3001) |

Set these variables in your environment before starting the backend. For local development, `FRONTEND_URL` can be set to `http://localhost:3000`.

The project does not currently load `.env` files automatically.

**Do not commit database credentials or other secrets to GitHub.**

### 3. Install Dependencies and Start

From the `backend` directory:

```bash
npm install
npx tsc
node dist/server.js
```

The backend runs on port `3001` by default.

### 4. Test the API

The API can be tested using Postman.

Example registration endpoint:

```http
POST http://localhost:3001/auth/register
Content-Type: application/json
```

Request body:

```json
{
  "fullName": "Demo Admin",
  "email": "admin@example.com",
  "password": "examplePassword123",
  "workspaceName": "Demo Workspace"
}
```

Registration creates a Workspace, an Admin account, and an authenticated session.

Protected endpoints require the session token:

```http
Authorization: Bearer <token>
```

Other example endpoints:

```http
POST  /auth/login
GET   /projects
GET   /projects/:id/tasks
PATCH /tasks/:id
GET   /notifications
```

For the complete endpoint reference, see [API Documentation](docs/API.md).

## Documentation

The repository includes technical and product documentation:

- [Product Requirements (PRD)](docs/PRD.md)
- [REST API Documentation](docs/API.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database ERD](docs/ERD.md)
- [Technology Stack](docs/TECH_STACK.md)
- [Development Plan](docs/PLAN.md)

## Development Workflow

Development is organized into milestones and feature-based Git branches.

Each backend milestone has been implemented and manually verified using Postman before merging into the `master` branch through a Pull Request.

## Next Steps

- Implement the React frontend.
- Integrate frontend pages with the backend API.
- Complete end-to-end manual testing.
- Deploy the application.
- Provide a public live demo.

---

**Current focus:** Frontend development and preparation for the first complete MVP release.
