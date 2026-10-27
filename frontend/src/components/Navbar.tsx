import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
    const { user } = useAuth();

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
            </div>
        </nav>
    );
};

export default Navbar;
