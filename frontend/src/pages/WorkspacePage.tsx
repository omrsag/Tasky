import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

type Workspace = {
    id: number;
    name: string;
};

const WorkspacePage = () => {
    const { user, setUser, setToken } = useAuth();
    const navigate = useNavigate();

    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [workspaceName, setWorkspaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{
        type: "success" | "danger";
        message: string;
    } | null>(null);

    useEffect(() => {
        let active = true;

        const loadWorkspace = async () => {
            try {
                const response = await axios.get<{ workspace: Workspace }>(
                    "/workspace"
                );

                if (active) {
                    setWorkspace(response.data.workspace);
                    setWorkspaceName(response.data.workspace.name);
                }
            } catch {
                if (active) {
                    setError("Unable to load workspace.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadWorkspace();

        return () => {
            active = false;
        };
    }, []);

    const handleRenameWorkspace = async () => {
        if (!workspace || user?.role !== "Admin") return;

        const updatedName = workspaceName.trim();

        if (!updatedName) {
            setFeedback({
                type: "danger",
                message: "Workspace name is required.",
            });
            return;
        }

        setIsSaving(true);
        setFeedback(null);

        try {
            await axios.patch("/workspace", {
                name: updatedName,
            });

            setWorkspace({
                ...workspace,
                name: updatedName,
            });

            setWorkspaceName(updatedName);

            setFeedback({
                type: "success",
                message: "Workspace name updated successfully.",
            });
        } catch (error) {
            const message = axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message ?? "Unable to update workspace."
                : "Unable to update workspace.";

            setFeedback({
                type: "danger",
                message,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!workspace || user?.role !== "Admin" || isDeleting) return;

        setIsDeleting(true);
        setDeleteError(null);

        try {
            await axios.delete("/workspace");

            setUser(null);
            setToken(null);

            navigate("/login", { replace: true });
        } catch (error) {
            const message = axios.isAxiosError<{ message: string }>(error)
                ? error.response?.data?.message ?? "Unable to delete workspace."
                : "Unable to delete workspace.";

            setDeleteError(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">Workspace</h1>

            <p className="text-body-secondary">
                Manage your workspace settings.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading workspace...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : workspace ? (
                <div className="card">
                    <div className="card-body">
                        <h2 className="h5">Workspace Details</h2>

                        <p className="mb-0">
                            <strong>Name:</strong> {workspace.name}
                        </p>
                        {user?.role === "Admin" && (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void handleRenameWorkspace();
                                }}
                                className="mt-4"
                            >
                                <div className="mb-3">
                                    <label htmlFor="workspaceName" className="form-label">
                                        Workspace Name
                                    </label>

                                    <input
                                        id="workspaceName"
                                        type="text"
                                        className="form-control"
                                        value={workspaceName}
                                        onChange={(event) => {
                                            setWorkspaceName(event.target.value);
                                            setFeedback(null);
                                        }}
                                        disabled={isSaving}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        isSaving ||
                                        !workspaceName.trim() ||
                                        workspaceName.trim() === workspace.name
                                    }
                                >
                                    {isSaving ? "Saving..." : "Save Changes"}
                                </button>

                                {feedback && (
                                    <div
                                        className={`alert alert-${feedback.type} mt-3`}
                                        role="alert"
                                    >
                                        {feedback.message}
                                    </div>
                                )}
                            </form>
                        )}
                        {user?.role === "Admin" && (
                            <div className="border-top mt-4 pt-4">
                                <h3 className="h5 text-danger">Danger Zone</h3>

                                <p className="text-body-secondary">
                                    Permanently delete this workspace and all its data.
                                </p>

                                {!showDeleteConfirmation ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => setShowDeleteConfirmation(true)}
                                    >
                                        Delete Workspace
                                    </button>
                                ) : (
                                    <div className="alert alert-danger" role="alert">
                                        <p>
                                            Are you sure you want to permanently delete
                                            <strong> {workspace.name}</strong>?
                                        </p>

                                        <p>
                                            All workspace users, projects, tasks, and related
                                            data will be permanently deleted.
                                            This action cannot be undone.
                                        </p>

                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            disabled={isDeleting}
                                            onClick={() => setShowDeleteConfirmation(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-danger ms-2"
                                            onClick={() => void handleDeleteWorkspace()}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting..." : "Yes, Delete Workspace"}
                                        </button>

                                        {deleteError && (
                                            <p className="mt-3 mb-0 text-danger">
                                                {deleteError}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <p className="text-body-secondary">
                    Workspace not found.
                </p>
            )}
        </div>
    );
};

export default WorkspacePage;
