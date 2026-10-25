import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const App = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/register" element={<div>Registration</div>} />
                <Route path="/login" element={<div>Login</div>} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
                <Route path="/workspace" element={<div>Workspace</div>} />
                <Route path="/users" element={<div>Users</div>} />
                <Route path="/projects" element={<div>Projects</div>} />
                <Route path="/projects/:id" element={<div>Project Details</div>} />
                <Route path="/tasks/:id" element={<div>Task Details</div>} />
                <Route path="/notifications" element={<div>Notifications</div>} />
                <Route path="/profile" element={<div>Profile</div>} />
                <Route path="*" element={<div>Page not found</div>} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
