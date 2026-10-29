import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Workspace = {
    id: number;
    name: string;
};

const WorkspacePage = () => {
    const [workspace, setWorkspace] = useState<Workspace | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { user } = useAuth();

    const [workspaceName, setWorkspaceName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

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
