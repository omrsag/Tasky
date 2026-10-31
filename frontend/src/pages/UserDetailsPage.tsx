import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

type WorkspaceUser = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

type EditUserForm = {
    fullName: string;
    email: string;
    role: "Manager" | "Member";
    status: "Active" | "Disabled";
};

const UserDetailsPage = () => {
    const { id } = useParams();

    const [account, setAccount] = useState<WorkspaceUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<EditUserForm>({
        fullName: "",
        email: "",
        role: "Member",
        status: "Active",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isResettingPassword, setIsResettingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);

    const [feedback, setFeedback] = useState<{
        type: "success" | "danger";
        message: string;
    } | null>(null);

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            setIsLoading(true);
            setError(null);
            setAccount(null);
            setIsEditing(false);
            setIsResettingPassword(false);
            setNewPassword("");

            if (!id) {
                setError("Invalid user ID.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get<{
                    user: WorkspaceUser;
                }>(`/users/${id}`);

                if (active) {
                    setAccount(response.data.user);
                }
            } catch {
                if (active) {
                    setError("Unable to load user details.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadUser();

        return () => {
            active = false;
        };
    }, [id]);

    useEffect(() => {
        if (feedback?.type !== "success") return;

        const timer = setTimeout(() => {
            setFeedback(null);
        }, 3000);

        return () => clearTimeout(timer);
    }, [feedback]);

    const handleSaveUser = async () => {
        if (!account || account.role === "Admin") return;

        const fullName = editForm.fullName.trim();
        const email = editForm.email.trim();

        if (!fullName || !email) {
            setFeedback({
                type: "danger",
                message: "Full name and email are required.",
            });
            return;
        }

        setIsSaving(true);
        setFeedback(null);

        try {
            await axios.patch(`/users/${account.id}`, {
                fullName,
                email,
                role: editForm.role,
                status: editForm.status,
            });

            setAccount({
                ...account,
                fullName,
                email,
                role: editForm.role,
                status: editForm.status,
            });

            setIsEditing(false);

            setFeedback({
                type: "success",
                message: "User updated successfully.",
            });
        } catch (error) {
            const message = axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message ?? "Unable to update user."
                : "Unable to update user.";

            setFeedback({
                type: "danger",
                message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!account || account.role === "Admin") return;

        if (newPassword.length < 8) {
            setFeedback({
                type: "danger",
                message: "Password must be at least 8 characters.",
            });
            return;
        }

        setIsPasswordSaving(true);
        setFeedback(null);

        try {
            await axios.post(
                `/users/${account.id}/reset-password`,
                {
                    password: newPassword,
                }
            );

            setNewPassword("");
            setIsResettingPassword(false);

            setFeedback({
                type: "success",
                message: "Password reset successfully.",
            });
        } catch (error) {
            const message = axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message ?? "Unable to reset password."
                : "Unable to reset password.";

            setFeedback({
                type: "danger",
                message,
            });
        } finally {
            setIsPasswordSaving(false);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">User Details</h1>

            <p className="text-body-secondary">
                View and manage workspace user details.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading user details...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : account ? (
                <div className="card">
                    <div className="card-body">
                        <h2 className="h5 mb-3">Account Information</h2>

                        <p>
                            <strong>Full Name:</strong> {account.fullName}
                        </p>

                        <p>
                            <strong>Email:</strong> {account.email}
                        </p>

                        <p>
                            <strong>Role:</strong> {account.role}
                        </p>

                        <p className="mb-0">
                            <strong>Status:</strong> {account.status}
                        </p>
                        {account.role !== "Admin" && (
                            <button
                                type="button"
                                className="btn btn-outline-primary mt-3"
                                disabled={isSaving}
                                onClick={() => {
                                    if (!isEditing && account.role !== "Admin") {
                                        setEditForm({
                                            fullName: account.fullName,
                                            email: account.email,
                                            role: account.role,
                                            status: account.status,
                                        });
                                    }

                                    setIsEditing(!isEditing);
                                }}
                            >
                                {isEditing ? "Cancel" : "Edit User"}
                            </button>
                        )}
                        {account.role !== "Admin" && (
                            <div className="mt-3">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    disabled={isPasswordSaving}
                                    onClick={() => {
                                        setIsResettingPassword(!isResettingPassword);
                                        setIsEditing(false);
                                        setNewPassword("");
                                    }}
                                >
                                    {isResettingPassword ? "Cancel Reset" : "Reset Password"}
                                </button>

                                {isResettingPassword && (
                                    <div className="card mt-3">
                                        <div className="card-body">
                                            <h3 className="h5">Reset Password</h3>

                                            <p className="text-body-secondary mb-0">
                                                Set a new password for this user.
                                            </p>
                                            <div className="mt-3">
                                                <label htmlFor="newPassword" className="form-label">
                                                    New Password
                                                </label>

                                                <input
                                                    id="newPassword"
                                                    type="password"
                                                    className="form-control"
                                                    value={newPassword}
                                                    onChange={(event) => setNewPassword(event.target.value)}
                                                    minLength={8}
                                                    disabled={isPasswordSaving}
                                                    required
                                                />

                                                <div className="form-text">
                                                    Password must be at least 8 characters.
                                                </div>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary mt-3"
                                                    onClick={() => void handleResetPassword()}
                                                    disabled={isPasswordSaving || newPassword.length < 8}
                                                >
                                                    {isPasswordSaving ? "Saving..." : "Save Password"}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {feedback && (
                            <div
                                className={`alert alert-${feedback.type} mt-3`}
                                role="alert"
                            >
                                {feedback.message}
                            </div>
                        )}
                        {isEditing && account.role !== "Admin" && (
                            <div className="mt-4">
                                <h3 className="h5 mb-3">Edit Account</h3>

                                <div className="mb-3">
                                    <label htmlFor="editFullName" className="form-label">
                                        Full Name
                                    </label>
                                    <input
                                        id="editFullName"
                                        type="text"
                                        className="form-control"
                                        value={editForm.fullName}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                fullName: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="editEmail" className="form-label">
                                        Email
                                    </label>
                                    <input
                                        id="editEmail"
                                        type="email"
                                        className="form-control"
                                        value={editForm.email}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                email: event.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="editRole" className="form-label">
                                        Role
                                    </label>
                                    <select
                                        id="editRole"
                                        className="form-select"
                                        value={editForm.role}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                role: event.target.value as "Manager" | "Member",
                                            })
                                        }
                                    >
                                        <option value="Manager">Manager</option>
                                        <option value="Member">Member</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="editStatus" className="form-label">
                                        Status
                                    </label>
                                    <select
                                        id="editStatus"
                                        className="form-select"
                                        value={editForm.status}
                                        onChange={(event) =>
                                            setEditForm({
                                                ...editForm,
                                                status: event.target.value as "Active" | "Disabled",
                                            })
                                        }
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Disabled">Disabled</option>
                                    </select>
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => void handleSaveUser()}
                                    disabled={
                                        isSaving ||
                                        !editForm.fullName.trim() ||
                                        !editForm.email.trim()
                                    }
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-body-secondary">
                    User not found.
                </p>
            )}
        </div>
    );
};

export default UserDetailsPage;
