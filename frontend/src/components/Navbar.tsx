import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type UnreadCountResponse = {
	unreadCount: number;
};

const Navbar = () => {
    const { user, setUser, setToken } = useAuth();
    const navigate = useNavigate();

    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [logoutError, setLogoutError] = useState<string | null>(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadCountError, setUnreadCountError] = useState("");

    useEffect(() => {
        if (!user?.id) {
            setUnreadCount(0);
            return;
        }

        const fetchUnreadCount = async () => {
            try {
                setUnreadCountError("");

                const response = await axios.get<UnreadCountResponse>(
                    "/notifications/unread-count"
                );

                setUnreadCount(response.data.unreadCount);
            } catch (error) {
                setUnreadCount(0);

                if (axios.isAxiosError<{ message: string }>(error)) {
                    setUnreadCountError(
                        error.response?.data?.message ||
                        "Unable to load unread notifications."
                    );
                } else {
                    setUnreadCountError("Unable to load unread notifications.");
                }
            }
        };

        void fetchUnreadCount();
    }, [user?.id]);

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

                    <NavLink
                        className="nav-link d-inline-flex align-items-center gap-2"
                        to="/notifications"
                    >
                        Notifications

                        {unreadCount > 0 && (
                            <span className="badge rounded-pill text-bg-danger">
                                {unreadCount}
                            </span>
                        )}
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
                {unreadCountError && (
                    <div className="alert alert-warning w-100 mb-0" role="alert">
                        {unreadCountError}
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
