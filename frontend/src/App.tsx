import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import ProjectsPage from "./pages/ProjectsPage";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import GuestRoute from "./components/GuestRoute";
import DashboardPage from "./pages/DashboardPage";
import WorkspacePage from "./pages/WorkspacePage";
import UsersPage from "./pages/UsersPage";
import UserDetailsPage from "./pages/UserDetailsPage";
import AdminRoute from "./components/AdminRoute";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import EditProjectPage from "./pages/EditProjectPage";

const App = () => {
  return (
      <BrowserRouter>
          <Routes>
            <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route element={<AdminRoute />}>
                    <Route path="/projects/new" element={<CreateProjectPage />} />
                    <Route path="/workspace" element={<WorkspacePage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/users/:id" element={<UserDetailsPage />} />
                  </Route>
                  <Route path="/projects" element={<ProjectsPage />} />
                  <Route path="/projects/:id" element={<ProjectDetailsPage />} />
                  <Route path="/projects/:id/edit" element={<EditProjectPage />} />
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
