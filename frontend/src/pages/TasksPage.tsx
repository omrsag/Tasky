import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Task = {
    id: number;
    title: string;
    status: string;
    priority: "Low" | "Medium" | "High";
    dueDate: string | null;
    assigneeId: number;
};

type Project = {
	id: number;
	managerId: number;
	status: "Active" | "Completed" | "Archived";
};

type ProjectMember = {
	id: number;
	fullName: string;
};

const TasksPage = () => {
    const { id } = useParams();
    const { user } = useAuth();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);

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

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setIsLoadingMembers(true);
                setMembersError(null);
                setMembers([]);

                const response = await axios.get<{ members: ProjectMember[] }>(
                    `/projects/${id}/members`
                );

                setMembers(response.data.members);
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setMembersError(
                        error.response?.data?.message ||
                        "Unable to load project members."
                    );
                } else {
                    setMembersError("Unable to load project members.");
                }
            } finally {
                setIsLoadingMembers(false);
            }
        };

        void fetchMembers();
    }, [id]);

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
            {membersError && (
                <div className="alert alert-danger">
                    {membersError}
                </div>
            )}
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
                                <th>Priority</th>
                                <th>Due Date</th>
                                <th>Assignee</th>
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
                                    <td>{task.priority}</td>
                                    <td>
                                        {task.dueDate
                                            ? task.dueDate.slice(0, 10)
                                            : "Not set"}
                                    </td>
                                    <td>
                                        {isLoadingMembers
                                            ? "Loading..."
                                            : members.find((member) => member.id === task.assigneeId)?.fullName ||
                                                `User #${task.assigneeId}`}
                                    </td>
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
