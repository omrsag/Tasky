import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Task = {
    id: number;
    title: string;
    status: string;
};

type Project = {
	id: number;
	managerId: number;
	status: "Active" | "Completed" | "Archived";
};

const TasksPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await axios.get<{ tasks: Task[] }>(
                    `/projects/${id}/tasks`
                );

                setTasks(response.data.tasks);
            } catch {
                setError("Unable to load project tasks.");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchTasks();
    }, [id]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setProject(null);

                const response = await axios.get<{ project: Project }>(
                    `/projects/${id}`
                );

                setProject(response.data.project);
            } catch {
                setProject(null);
            }
        };

        void fetchProject();
    }, [id]);

    const canCreateTask =
        project?.id === Number(id) &&
        project.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" && user.id === project.managerId));

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Project Tasks</h2>

                <div className="d-flex gap-2">
                    {canCreateTask && (
                        <Link
                            to={`/projects/${id}/tasks/new`}
                            className="btn btn-primary"
                        >
                            Create Task
                        </Link>
                    )}

                    <Link
                        to={`/projects/${id}`}
                        className="btn btn-outline-secondary"
                    >
                        Back to Project
                    </Link>
                </div>
            </div>
            {isLoading ? (
                <p>Loading tasks...</p>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : tasks.length === 0 ? (
                <div className="alert alert-info">
                    No tasks found for this project.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Task</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {tasks.map((task) => (
                                <tr key={task.id}>
                                    <td>
                                        <Link to={`/tasks/${task.id}`}>
                                            {task.title}
                                        </Link>
                                    </td>
                                    <td>{task.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TasksPage;
