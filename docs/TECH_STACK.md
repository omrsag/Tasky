# Tasky — Tech Stack

## 1. Overview

Tasky will use a separated frontend and backend architecture:

**React + TypeScript Frontend → Axios → Express + TypeScript REST API → MySQL**

The stack is intentionally simple and focused on the MVP.

## 2. Frontend

- **React** — Frontend library.
- **TypeScript** — Frontend programming language.
- **Create React App** — React project setup.
- **react-router-dom** — Client-side routing.
- **Axios** — HTTP requests to the backend REST API.
- **Bootstrap** — Main UI styling framework.
- **CSS** — Simple custom styling when needed.
- **React Context API (`AuthContext`)** — Authentication state management.
- **localStorage** — Stores the authentication session token in the browser.

## 3. Backend

- **Node.js** — Backend runtime.
- **TypeScript** — Backend programming language.
- **Express** — REST API server.
- **CommonJS** — Backend compiled module format.
- **CORS** — Allows communication between the separately hosted frontend and backend.
- **Multer** — Handles profile image and task attachment uploads.
- **bcrypt** — Password hashing and password verification.
- **Node.js `crypto`** — Generates secure random session tokens.
- **Node.js `path`** — File path handling.
- **Node.js `fs`** — Local file management.

For the MVP, the backend application logic will remain in a single `server.ts` file.

## 4. Database

- **MySQL** — Main relational database.
- **mysql2** — Connects Express to MySQL and executes SQL queries directly with `db.query()`.
- **phpMyAdmin** — Database management during development.

No ORM will be used. SQL queries will be written directly.

## 5. Authentication

Tasky will use a custom server-side token/session approach instead of JWT.

- Successful login generates a secure random token using Node.js `crypto`.
- Sessions are stored in MySQL and linked to users.
- React stores the token in `localStorage`.
- Axios sends the token with protected API requests.
- Express validates the token against MySQL and checks that the user account is still `Active`.
- Logout removes the token from the browser and invalidates/deletes the session in MySQL.
- The session remains available after page refresh or browser restart until logout or invalidation.

## 6. File Storage

- Files are stored locally by the backend.
- **Multer** handles uploads.
- **path** and **fs** handle file paths and file deletion.
- MySQL stores file references/paths rather than file contents.
- Task attachments are limited to **10 MB per file**.

Example structure:

```text
backend/
├── uploads/
│   ├── attachments/
│   └── profile-images/
└── server.ts
```

## 7. Notifications

Notifications will use **Axios polling** instead of WebSockets or Socket.io.

The frontend will periodically request notification updates from the backend.

## 8. Development Tools

- **npm** — Package management.
- **Visual Studio Code** — Code editor.
- **Postman** — REST API testing.
- **Git** — Version control.
- **GitHub** — Source-code repository hosting.
- **TypeScript Compiler (`tsc`)** — Compiles TypeScript source code to JavaScript.

The backend will be started with:

```bash
npx tsc
node dist/server.js
```

No `nodemon` will be used.

## 9. Hosting

- **Frontend:** Vercel.
- **Backend:** Oracle Cloud Always Free VM.
- **Database:** MySQL on the Oracle Cloud VM.
- **Uploaded Files:** Local persistent storage on the Oracle Cloud VM.

Deployment secrets and database credentials will be provided through hosting environment variables and read in Node.js through `process.env`.

## 10. Not Used

The MVP will not use:

- Vite
- Vue
- JWT
- Sequelize or another ORM
- Tailwind CSS
- Material UI
- Socket.io / WebSockets
- dotenv
- nodemon
