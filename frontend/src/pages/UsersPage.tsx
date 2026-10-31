import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type WorkspaceUser = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

type CreateUserForm = {
    fullName: string;
    email: string;
    password: string;
    role: "Manager" | "Member";
};

const UsersPage = () => {
    const [users, setUsers] = useState<WorkspaceUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    
    const [createForm, setCreateForm] = useState<CreateUserForm>({
        fullName: "",
        email: "",
        password: "",
        role: "Member",
    });

    const [isSaving, setIsSaving] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    const [createFeedback, setCreateFeedback] = useState<{
        type: "success" | "danger";
        message: string;
    } | null>(null);

    const { user } = useAuth();

    useEffect(() => {
        setIsLoading(true);
        setError(null);

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
    }, [refreshCount]);

    const handleCreateUser = async () => {
        if (user?.role !== "Admin") return;

        const fullName = createForm.fullName.trim();
        const email = createForm.email.trim();

        if (!fullName || !email || createForm.password.length < 8) {
            setCreateFeedback({
                type: "danger",
                message: "Please provide valid user information.",
            });
            return;
        }

        setIsSaving(true);
        setCreateFeedback(null);

        try {
            await axios.post("/users", {
                fullName,
                email,
                password: createForm.password,
                role: createForm.role,
            });

            setCreateForm({
                fullName: "",
                email: "",
                password: "",
                role: "Member",
            });

            setIsCreating(false);
            setRefreshCount((count) => count + 1);

            setCreateFeedback({
                type: "success",
                message: "User created successfully.",
            });
        } catch (error) {
            const message = axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message ?? "Unable to create user."
                : "Unable to create user.";

            setCreateFeedback({
                type: "danger",
                message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (createFeedback?.type !== "success") return;

        const timer = setTimeout(() => {
            setCreateFeedback(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [createFeedback]);

    return (
        <div>
            <h1 className="h3 mb-3">Users</h1>

            <p className="text-body-secondary">
                Manage workspace users and their account details.
            </p>
            {user?.role === "Admin" && (
                <div className="mb-4">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setIsCreating(!isCreating)}
                    >
                        {isCreating ? "Cancel" : "Create User"}
                    </button>

                    {createFeedback && (
                        <div
                            className={`alert alert-${createFeedback.type} mt-3`}
                            role="alert"
                        >
                            {createFeedback.message}
                        </div>
                    )}

                    {isCreating && (
                        <div className="card mt-3">
                            <div className="card-body">
                                <h2 className="h5 mb-0">New User</h2>
                                <form
                                    className="mt-3"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        void handleCreateUser();
                                    }}
                                >
                                    <div className="mb-3">
                                        <label htmlFor="createFullName" className="form-label">
                                            Full Name
                                        </label>

                                        <input
                                            id="createFullName"
                                            type="text"
                                            className="form-control"
                                            value={createForm.fullName}
                                            onChange={(event) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    fullName: event.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="createEmail" className="form-label">
                                            Email
                                        </label>

                                        <input
                                            id="createEmail"
                                            type="email"
                                            className="form-control"
                                            value={createForm.email}
                                            onChange={(event) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    email: event.target.value,
                                                })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="createPassword" className="form-label">
                                            Password
                                        </label>

                                        <input
                                            id="createPassword"
                                            type="password"
                                            className="form-control"
                                            value={createForm.password}
                                            onChange={(event) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    password: event.target.value,
                                                })
                                            }
                                            minLength={8}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="createRole" className="form-label">
                                            Role
                                        </label>

                                        <select
                                            id="createRole"
                                            className="form-select"
                                            value={createForm.role}
                                            onChange={(event) =>
                                                setCreateForm({
                                                    ...createForm,
                                                    role: event.target.value as "Manager" | "Member",
                                                })
                                            }
                                        >
                                            <option value="Manager">Manager</option>
                                            <option value="Member">Member</option>
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Creating..." : "Create Account"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
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
