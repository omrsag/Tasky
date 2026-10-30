import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

type WorkspaceUser = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

const UsersPage = () => {
    const [users, setUsers] = useState<WorkspaceUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadUsers = async () => {
            try {
                const response = await axios.get<{
                    users: WorkspaceUser[];
                }>("/users");

                if (active) {
                    setUsers(response.data.users);
                }
            } catch {
                if (active) {
                    setError("Unable to load users.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadUsers();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div>
            <h1 className="h3 mb-3">Users</h1>

            <p className="text-body-secondary">
                Manage workspace users and their account details.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading users...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : users.length === 0 ? (
                <p className="text-body-secondary">
                    No users found.
                </p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {users.map((account) => (
                                <tr key={account.id}>
                                    <td>
                                        <Link
                                            to={`/users/${account.id}`}
                                            className="text-decoration-none"
                                        >
                                            {account.fullName}
                                        </Link>
                                    </td>
                                    <td>{account.email}</td>
                                    <td>{account.role}</td>
                                    <td>{account.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default UsersPage;
