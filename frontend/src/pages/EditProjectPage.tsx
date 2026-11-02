import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Project = {
    id: number;
    name: string;
    description: string | null;
    managerId: number;
    managerName: string;
    startDate: string | null;
    endDate: string | null;
    status: "Active" | "Completed" | "Archived";
};

type WorkspaceUser = {
    id: number;
    fullName: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

const EditProjectPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [managers, setManagers] = useState<WorkspaceUser[]>([]);
    const [managerId, setManagerId] = useState("");
    const [isLoadingManagers, setIsLoadingManagers] = useState(false);
    const [managersError, setManagersError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadProject = async () => {
            setIsLoading(true);
            setError(null);
            setProject(null);

            if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
                setError("Invalid project ID.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get<{
                    project: Project;
                }>(`/projects/${id}`);

                if (active) {
                    const loadedProject = response.data.project;

                    setProject(loadedProject);
                    setName(loadedProject.name);
                    setDescription(loadedProject.description ?? "");
                    setStartDate(loadedProject.startDate ?? "");
                    setEndDate(loadedProject.endDate ?? "");
                    setManagerId(String(loadedProject.managerId));
                }
            } catch (error) {
                if (active) {
                    if (axios.isAxiosError<{ message: string }>(error)) {
                        setError(
                            error.response?.data?.message ||
                            "Unable to load project."
                        );
                    } else {
                        setError("Unable to load project.");
                    }
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

    useEffect(() => {
        if (
            user?.role !== "Admin" ||
            !project ||
            project.status !== "Active"
        ) {
            return;
        }

        let active = true;

        const loadManagers = async () => {
            setIsLoadingManagers(true);
            setManagersError(null);
            setManagers([]);

            try {
                const response = await axios.get<{
                    users: WorkspaceUser[];
                }>("/users");

                if (active) {
                    const eligibleManagers = response.data.users.filter(
                        (user) =>
                            user.role === "Manager" &&
                            user.status === "Active"
                    );

                    setManagers(eligibleManagers);
                }
            } catch {
                if (active) {
                    setManagersError("Unable to load managers.");
                }
            } finally {
                if (active) {
                    setIsLoadingManagers(false);
                }
            }
        };

        void loadManagers();

        return () => {
            active = false;
        };
    }, [project, user?.role]);

    const canEditProject =
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" &&
                user.id === project.managerId));

    const handleUpdateProject = async () => {
        if (isSubmitting || !project || !canEditProject) return;

        setSubmitError(null);

        if (!name.trim() || name.trim().length > 255) {
            setSubmitError("Invalid project name.");
            return;
        }

        if (startDate && endDate && endDate < startDate) {
            setSubmitError("End date cannot be before start date.");
            return;
        }

        if (
            user?.role === "Admin" &&
            !managers.some((manager) => manager.id === Number(managerId))
        ) {
            setSubmitError("Please select a valid manager.");
            return;
        }

        const updates = {
            name: name.trim(),
            description: description.trim() || null,
            startDate: startDate || null,
            endDate: endDate || null,
            ...(user?.role === "Admin" &&
            Number(managerId) !== project.managerId
                ? { managerId: Number(managerId) }
                : {}),
        };

        setIsSubmitting(true);

        try {
            await axios.patch(`/projects/${project.id}`, updates);

            navigate(`/projects/${project.id}`);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setSubmitError(
                    error.response?.data?.message ||
                    "Unable to update project."
                );
            } else {
                setSubmitError("Unable to update project.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">Edit Project</h1>

            <p className="text-body-secondary">
                Update project information.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading project...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : project && !canEditProject ? (
                <div className="alert alert-warning" role="alert">
                    {project.status !== "Active"
                        ? "This project is read-only."
                        : "You do not have permission to edit this project."}
                </div>
            ) : project ? (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleUpdateProject();
                    }}
                >
                    <div className="card">
                        <div className="card-body">
                            <h2 className="h5 mb-3">Edit Project Information</h2>
                            {submitError && (
                                <div className="alert alert-danger" role="alert">
                                    {submitError}
                                </div>
                            )}
                            <div className="mb-3">
                                <label htmlFor="projectName" className="form-label">
                                    Project Name
                                </label>

                                <input
                                    id="projectName"
                                    type="text"
                                    className="form-control"
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    maxLength={255}
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">
                                    Description
                                </label>

                                <textarea
                                    id="description"
                                    className="form-control"
                                    rows={3}
                                    value={description}
                                    onChange={(event) => setDescription(event.target.value)}
                                />
                            </div>

                            <div className="row g-3 mb-3">
                                <div className="col-md-6">
                                    <label htmlFor="startDate" className="form-label">
                                        Start Date
                                    </label>

                                    <input
                                        id="startDate"
                                        type="date"
                                        className="form-control"
                                        value={startDate}
                                        onChange={(event) => setStartDate(event.target.value)}
                                    />
                                </div>

                                <div className="col-md-6">
                                    <label htmlFor="endDate" className="form-label">
                                        End Date
                                    </label>

                                    <input
                                        id="endDate"
                                        type="date"
                                        className="form-control"
                                        value={endDate}
                                        onChange={(event) => setEndDate(event.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="mb-0">
                                <label htmlFor="manager" className="form-label">
                                    Responsible Manager
                                </label>

                                {user?.role === "Admin" ? (
                                    isLoadingManagers ? (
                                        <p className="text-body-secondary" role="status">
                                            Loading managers...
                                        </p>
                                    ) : managersError ? (
                                        <div className="alert alert-danger" role="alert">
                                            {managersError}
                                        </div>
                                    ) : (
                                        <>
                                            <select
                                                id="manager"
                                                className="form-select"
                                                value={managerId}
                                                onChange={(event) =>
                                                    setManagerId(event.target.value)
                                                }
                                                disabled={managers.length === 0}
                                                required
                                            >
                                                <option value="" disabled>
                                                    Select a Manager
                                                </option>

                                                {managers.map((manager) => (
                                                    <option
                                                        key={manager.id}
                                                        value={manager.id}
                                                    >
                                                        {manager.fullName}
                                                    </option>
                                                ))}
                                            </select>

                                            {managers.length === 0 && (
                                                <p className="text-body-secondary mt-2">
                                                    No active managers available.
                                                </p>
                                            )}
                                        </>
                                    )
                                ) : (
                                    <p className="form-control-plaintext mb-0">
                                        {project.managerName}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="d-flex flex-wrap gap-2 mt-3">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                isSubmitting ||
                                (user?.role === "Admin" &&
                                    (isLoadingManagers ||
                                        !!managersError ||
                                        managers.length === 0))
                            }
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>

                        <Link
                            to={`/projects/${project.id}`}
                            className="btn btn-outline-secondary"
                        >
                            Cancel
                        </Link>
                    </div>
                </form>
            ) : (
                <p className="text-body-secondary">
                    Project not found.
                </p>
            )}
        </div>
    );
};

export default EditProjectPage;
