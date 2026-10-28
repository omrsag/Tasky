import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ProjectsPage from "./pages/ProjectsPage";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import GuestRoute from "./components/GuestRoute";

const App = () => {
  return (
      <BrowserRouter>
          <Routes>
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<div>Dashboard</div>} />
                  <Route path="/workspace" element={<div>Workspace</div>} />
                  <Route path="/users" element={<div>Users</div>} />
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<div>Project Details</div>} />
                  <Route path="/tasks/:id" element={<div>Task Details</div>} />
                  <Route path="/notifications" element={<div>Notifications</div>} />
                  <Route path="/profile" element={<div>Profile</div>} />
                </Route>
            </Route>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<GuestRoute />}>
              <Route path="/register" element={<RegistrationPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>
            <Route path="*" element={<div>Page not found</div>} />
          </Routes>
      </BrowserRouter>
  );
}

export default App;
