import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestRoute = () => {
    const { user, token, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return <div>Checking session...</div>;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    if (token) {
        return (
            <div className="container py-5">
                <p>Could not verify your session.</p>
                <button
                    className="btn btn-primary"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </button>
            </div>
        );
    }

    return <Outlet />;
};

export default GuestRoute;
