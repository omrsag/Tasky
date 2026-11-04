import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

type Task = {
    id: number;
    projectId: number;
    title: string;
    description: string | null;
    assigneeId: number;
    priority: "Low" | "Medium" | "High";
    status: "Todo" | "In Progress" | "Review" | "Done";
    dueDate: string | null;
};

const TaskDetailsPage = () => {
    const { id } = useParams();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setTask(null);

                const response = await axios.get<{ task: Task }>(
                    `/tasks/${id}`
                );

                setTask(response.data.task);
            } catch {
                setError("Unable to load task details.");
            } finally {
                setIsLoading(false);
            }
        };

        void fetchTask();
    }, [id]);

    return (
        <div>
            <h2 className="mb-4">Task Details</h2>
            {isLoading ? (
                <p>Loading task...</p>
            ) : error ? (
                <div className="alert alert-danger">{error}</div>
            ) : !task ? (
                <div className="alert alert-warning">
                    Task not found.
                </div>
            ) : (
            <div className="card">
                <div className="card-body">
                    <h4 className="card-title mb-3">
                        {task.title}
                    </h4>

                    <p className="card-text">
                        {task.description || "No description provided."}
                    </p>

                    <hr />

                    <p>
                        <strong>Status:</strong> {task.status}
                    </p>

                    <p>
                        <strong>Priority:</strong> {task.priority}
                    </p>

                    <p>
                        <strong>Due Date:</strong>{" "}
                        {task.dueDate
                            ? task.dueDate.slice(0, 10)
                            : "Not set"}
                    </p>
                    <Link
                        to={`/projects/${task.projectId}/tasks`}
                        className="btn btn-outline-secondary mt-2"
                    >
                        Back to Project Tasks
                    </Link>
                </div>
            </div>
            )}
        </div>
    );
};

export default TaskDetailsPage;