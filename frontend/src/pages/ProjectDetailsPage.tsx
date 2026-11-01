import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

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

    const [project, setProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                        <h2 className="h5 mb-3">Project Information</h2>
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
