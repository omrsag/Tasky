import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

type WorkspaceUser = {
    id: number;
    fullName: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

const CreateProjectPage = () => {
    const navigate = useNavigate();
    
    const [managers, setManagers] = useState<WorkspaceUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [managerId, setManagerId] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadManagers = async () => {
            setIsLoading(true);
            setError(null);

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
                    setError("Unable to load managers.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadManagers();

        return () => {
            active = false;
        };
    }, []);

    const handleCreateProject = async () => {
        if (isSubmitting) return;

        setSubmitError(null);

        if (!name.trim() || !managerId) {
            setSubmitError("Project name and manager are required.");
            return;
        }

        if (!managers.some((manager) => manager.id === Number(managerId))) {
            setSubmitError("Please select a valid manager.");
            return;
        }

        if (startDate && endDate && endDate < startDate) {
            setSubmitError("End date cannot be before start date.");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await axios.post<{
                project: { id: number };
            }>("/projects", {
                name: name.trim(),
                description: description.trim() || null,
                managerId: Number(managerId),
                startDate: startDate || null,
                endDate: endDate || null,
            });

            navigate(`/projects/${response.data.project.id}`);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setSubmitError(
                    error.response?.data?.message ||
                    "Unable to create project."
                );
            } else {
                setSubmitError("Unable to create project.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">Create Project</h1>

            <p className="text-body-secondary">
                Create a new project and assign a responsible manager.
            </p>

            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading managers...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : (
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleCreateProject();
                    }}
                >
                    <div className="card">

                        <div className="card-body">
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

                            <div className="mb-3">
                                <label htmlFor="manager" className="form-label">
                                    Responsible Manager
                                </label>

                                <select
                                    id="manager"
                                    className="form-select"
                                    value={managerId}
                                    onChange={(event) => setManagerId(event.target.value)}
                                    disabled={managers.length === 0}
                                    required
                                >
                                    <option value="" disabled>
                                        Select a Manager
                                    </option>

                                    {managers.map((manager) => (
                                        <option key={manager.id} value={manager.id}>
                                            {manager.fullName}
                                        </option>
                                    ))}
                                </select>

                                {managers.length === 0 && (
                                    <p className="text-body-secondary mt-2">
                                        No active managers available.
                                    </p>
                                )}
                            </div>

                            <div className="row g-3">
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
                            {submitError && (
                                <div className="alert alert-danger" role="alert">
                                    {submitError}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-3">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isSubmitting || managers.length === 0}
                        >
                            {isSubmitting ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default CreateProjectPage;
