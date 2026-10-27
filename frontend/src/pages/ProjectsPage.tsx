import axios from "axios";
import { useEffect, useState } from "react";

type Project = {
    id: number;
    name: string;
    status: "Active" | "Completed" | "Archived";
};

const ProjectsPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        let active = true;

        const loadProjects = async () => {
            try {
                const response = await axios.get<{ projects: Project[] }>(
                    "/projects"
                );

                if (active) {
                    setProjects(response.data.projects);
                }
            } catch (error) {
                console.error("Failed to load projects:", error);
            }
        };

        void loadProjects();

        return () => {
            active = false;
        };
    }, []);

    return (
        <div>
            <h1>Projects</h1>

            <ul>
                {projects.map((project) => (
                    <li key={project.id}>
                        {project.name} - {project.status}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ProjectsPage;
