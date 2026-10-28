import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user, setUser, setToken } = useAuth();
    const navigate = useNavigate();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setLogoutError(null);

        try {
            await axios.post("/auth/logout");

            setToken(null);
            setUser(null);

            navigate("/login", { replace: true });
        } catch (error) {
            if (
                axios.isAxiosError(error) &&
                (error.response?.status === 401 ||
                    error.response?.status === 403)
            ) {
                setToken(null);
                setUser(null);
                navigate("/login", { replace: true });
                return;
            }

            setLogoutError("Logout failed. Please try again.");
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <nav className="navbar bg-body-tertiary border-bottom">
            <div className="container d-flex flex-wrap align-items-center gap-3">
                <Link className="navbar-brand fw-bold" to="/dashboard">
                    Tasky
                </Link>

                <div className="d-flex flex-wrap align-items-center gap-3">
                    <NavLink className="nav-link" to="/dashboard">
                        Dashboard
                    </NavLink>

                    <NavLink className="nav-link" to="/projects">
                        Projects
                    </NavLink>

                    {user?.role === "Admin" && (
                        <>
                            <NavLink className="nav-link" to="/workspace">
                                Workspace
                            </NavLink>

                            <NavLink className="nav-link" to="/users">
                                Users
                            </NavLink>
                        </>
                    )}

                    <NavLink className="nav-link" to="/notifications">
                        Notifications
                    </NavLink>

                    <NavLink className="nav-link" to="/profile">
                        Profile
                    </NavLink>
                </div>

                <span className="small text-body-secondary ms-auto">
                    {user?.fullName}
                </span>
                <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? "Logging out..." : "Logout"}
                </button>

                {logoutError && (
                    <div className="alert alert-danger w-100 mb-0" role="alert">
                        {logoutError}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
