import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

type Task = {
    id: number;
    title: string;
    status: string;
};

const TasksPage = () => {
    const { id } = useParams();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Project Tasks</h2>

                <Link
                    to={`/projects/${id}`}
                    className="btn btn-outline-secondary"
                >
                    Back to Project
                </Link>
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
