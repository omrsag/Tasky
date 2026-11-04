import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Project = {
    id: number;
    name: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
    status: "Active" | "Completed" | "Archived";
    managerId: number;
    managerName: string;
};

const ProjectDetailsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isChangingStatus, setIsChangingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadProject = async () => {
            setIsLoading(true);
            setError(null);
            setProject(null);

            if (!id) {
                setError("Invalid project ID.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get<{
                    project: Project;
                }>(`/projects/${id}`);

                if (active) {
                    setProject(response.data.project);
                }
            } catch {
                if (active) {
                    setError("Unable to load project details.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadProject();

        return () => {
            active = false;
        };
    }, [id]);

    const canEditProject =
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" &&
                user.id === project.managerId));

    const handleChangeProjectStatus = async (
        nextStatus: "Completed" | "Archived"
    ) => {
        if (!project || !canEditProject || isChangingStatus) return;

        setStatusError(null);
        setIsChangingStatus(true);

        try {
            await axios.patch(`/projects/${project.id}`, {
                status: nextStatus,
            });

            const response = await axios.get<{
                project: Project;
            }>(`/projects/${project.id}`);

            setProject(response.data.project);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setStatusError(
                    error.response?.data?.message ||
                    "Unable to update project status."
                );
            } else {
                setStatusError("Unable to update project status.");
            }
        } finally {
            setIsChangingStatus(false);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">Project Details</h1>

            <p className="text-body-secondary">
                View and manage project information.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading project details...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : project ? (
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                            <h2 className="h5 mb-0">Project Information</h2>

                            <div className="d-flex flex-wrap gap-2">
                                <Link
                                    to={`/projects/${project.id}/members`}
                                    className="btn btn-outline-secondary btn-sm"
                                >
                                    Project Members
                                </Link>

                                {canEditProject && (
                                    <Link
                                        to={`/projects/${project.id}/edit`}
                                        className="btn btn-outline-primary btn-sm"
                                    >
                                        Edit Project
                                    </Link>
                                )}
                                {canEditProject && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-success btn-sm"
                                        onClick={() => void handleChangeProjectStatus("Completed")}
                                        disabled={isChangingStatus}
                                    >
                                        {isChangingStatus ? "Updating..." : "Mark as Completed"}
                                    </button>
                                )}
                                {canEditProject && (
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning btn-sm"
                                        onClick={() => void handleChangeProjectStatus("Archived")}
                                        disabled={isChangingStatus}
                                    >
                                        {isChangingStatus ? "Updating..." : "Archive Project"}
                                    </button>
                                )}
                            </div>
                            {statusError && (
                                <div className="alert alert-danger mt-3" role="alert">
                                    {statusError}
                                </div>
                            )}
                        </div>
                        <p>
                            <strong>Name:</strong> {project.name}
                        </p>

                        <p>
                            <strong>Description:</strong>{" "}
                            {project.description || "No description provided."}
                        </p>

                        <p>
                            <strong>Start Date:</strong>{" "}
                            {project.startDate?.slice(0, 10) || "Not set"}
                        </p>

                        <p>
                            <strong>End Date:</strong>{" "}
                            {project.endDate?.slice(0, 10) || "Not set"}
                        </p>

                        <p>
                            <strong>Status:</strong> {project.status}
                        </p>

                        <p className="mb-0">
                            <strong>Responsible Manager:</strong>{" "}
                            {project.managerName}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="text-body-secondary">
                    Project not found.
                </p>
            )}
        </div>
    );
};

export default ProjectDetailsPage;
