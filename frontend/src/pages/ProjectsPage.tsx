import axios from "axios";
import { useEffect, useState } from "react";

type Project = {
    id: number;
    name: string;
    status: "Active" | "Completed" | "Archived";
};

const ProjectsPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        let active = true;

        const loadProjects = async () => {
            try {
                const response = await axios.get<{ projects: Project[] }>(
                    "/projects"
                );

                if (active) {
                    setProjects(response.data.projects);
                }
            } catch {
                if (active) {
                    setError("Unable to load projects. Please try again.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadProjects();

        return () => {
            active = false;
        };
    }, [retryCount]);

    return (
        <div>
            <h1>Projects</h1>
     
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading projects...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    <p className="mb-2">{error}</p>

                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setRetryCount((count) => count + 1)}
                    >
                        Retry
                    </button>
                </div>
            ) : projects.length === 0 ? (
                <p className="text-body-secondary">
                    No projects found.
                </p>
            ) : (
                <ul>
                    {projects.map((project) => (
                        <li key={project.id}>
                            {project.name} - {project.status}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProjectsPage;
