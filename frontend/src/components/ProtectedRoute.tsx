import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user, token, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return <div>Checking session...</div>;
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!user) {
        return (
            <div>
                <p>Could not verify your session.</p>
                <button onClick={() => window.location.reload()}>
                    Retry
                </button>
            </div>
        );
    }

    return <Outlet />;
};

export default ProtectedRoute;
