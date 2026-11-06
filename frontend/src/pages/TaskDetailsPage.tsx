import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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

type Project = {
	id: number;
	managerId: number;
	status: "Active" | "Completed" | "Archived";
};

type ProjectMember = {
	id: number;
	fullName: string;
};

const TaskDetailsPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [task, setTask] = useState<Task | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [assigneeName, setAssigneeName] = useState<string | null>(null);
    const [isLoadingAssignee, setIsLoadingAssignee] = useState(false);
    const [assigneeError, setAssigneeError] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);

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

    const projectId = task?.projectId;

    useEffect(() => {
        if (!projectId) {
            setProject(null);
            return;
        }

        const fetchProject = async () => {
            try {
                setProject(null);
                setProjectError(null);

                const response = await axios.get<{ project: Project }>(
                    `/projects/${projectId}`
                );

                setProject(response.data.project);
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setProjectError(
                        error.response?.data?.message ||
                        "Unable to load project information."
                    );
                } else {
                    setProjectError("Unable to load project information.");
                }
            }
        };

        void fetchProject();
    }, [projectId]);

    const canEditTask =
        task !== null &&
        project?.id === task.projectId &&
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" && user.id === project.managerId));

    const canChangeOwnTaskStatus =
        task !== null &&
        project?.id === task.projectId &&
        project.status === "Active" &&
        user?.role === "Member" &&
        user.id === task.assigneeId;

    const handleChangeTaskStatus = async (
        nextStatus: "Todo" | "In Progress" | "Review"
    ) => {
        if (!task || !canChangeOwnTaskStatus || isUpdatingStatus) {
            return;
        }

        const isValidTransition =
            (task.status === "Todo" && nextStatus === "In Progress") ||
            (task.status === "In Progress" &&
                (nextStatus === "Todo" || nextStatus === "Review"));

        if (!isValidTransition) {
            return;
        }

        try {
            setIsUpdatingStatus(true);
            setStatusError(null);

            await axios.patch(`/tasks/${task.id}`, {
                status: nextStatus
            });

            const response = await axios.get<{ task: Task }>(
                `/tasks/${task.id}`
            );

            setTask(response.data.task);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setStatusError(
                    error.response?.data?.message ||
                    "Unable to update task status."
                );
            } else {
                setStatusError("Unable to update task status.");
            }
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!task || !canEditTask || isDeleting) {
            return;
        }

        try {
            setIsDeleting(true);
            setDeleteError(null);

            await axios.delete(`/tasks/${task.id}`);

            navigate(`/projects/${task.projectId}/tasks`);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setDeleteError(
                    error.response?.data?.message ||
                    "Unable to delete task."
                );
            } else {
                setDeleteError("Unable to delete task.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    const assigneeId = task?.assigneeId;

    useEffect(() => {
        if (!projectId || !assigneeId) {
            setAssigneeName(null);
            setIsLoadingAssignee(false);
            return;
        }

        const fetchAssignee = async () => {
            try {
                setIsLoadingAssignee(true);
                setAssigneeError(null);
                setAssigneeName(null);

                const response = await axios.get<{ members: ProjectMember[] }>(
                    `/projects/${projectId}/members`
                );

                const assignee = response.data.members.find(
                    (member) => member.id === assigneeId
                );

                setAssigneeName(assignee?.fullName || null);
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setAssigneeError(
                        error.response?.data?.message ||
                        "Unable to load task assignee."
                    );
                } else {
                    setAssigneeError("Unable to load task assignee.");
                }
            } finally {
                setIsLoadingAssignee(false);
            }
        };

        void fetchAssignee();
    }, [projectId, assigneeId]);

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
                    {statusError && (
                        <div className="alert alert-danger">
                            {statusError}
                        </div>
                    )}
                    {canChangeOwnTaskStatus && task.status === "Todo" && (
                        <div className="mb-3">
                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={isUpdatingStatus}
                                onClick={() => void handleChangeTaskStatus("In Progress")}
                            >
                                Start Task
                            </button>
                        </div>
                    )}

                    {canChangeOwnTaskStatus && task.status === "In Progress" && (
                        <div className="d-flex gap-2 mb-3">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                disabled={isUpdatingStatus}
                                onClick={() => void handleChangeTaskStatus("Todo")}
                            >
                                Move to Todo
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary"
                                disabled={isUpdatingStatus}
                                onClick={() => void handleChangeTaskStatus("Review")}
                            >
                                Submit for Review
                            </button>
                        </div>
                    )}
                    <p>
                        <strong>Priority:</strong> {task.priority}
                    </p>
                    
                    <p>
                        <strong>Assignee:</strong>{" "}
                        {isLoadingAssignee
                            ? "Loading..."
                            : assigneeName || `User #${task.assigneeId}`}
                    </p>

                    {assigneeError && (
                        <div className="alert alert-danger">
                            {assigneeError}
                        </div>
                    )}

                    <p>
                        <strong>Due Date:</strong>{" "}
                        {task.dueDate
                            ? task.dueDate.slice(0, 10)
                            : "Not set"}
                    </p>
                    {projectError && (
                        <div className="alert alert-danger">
                            {projectError}
                        </div>
                    )}
                    {canEditTask && (
                        <Link
                            to={`/tasks/${task.id}/edit`}
                            className="btn btn-primary mt-2 me-2"
                        >
                            Edit Task
                        </Link>
                    )}
                    {canEditTask && (
                        <button
                            type="button"
                            className="btn btn-outline-danger mt-2 me-2"
                            onClick={() => {
                                setDeleteError(null);
                                setShowDeleteModal(true);
                            }}
                        >
                            Delete Task
                        </button>
                    )}
                    <Link
                        to={`/projects/${task.projectId}/tasks`}
                        className="btn btn-outline-secondary mt-2"
                    >
                        Back to Project Tasks
                    </Link>
                    {showDeleteModal && canEditTask && (
                        <>
                            <div
                                className="modal fade show d-block"
                                tabIndex={-1}
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="deleteTaskModalTitle"
                            >
                                <div className="modal-dialog modal-dialog-centered">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5
                                                className="modal-title"
                                                id="deleteTaskModalTitle"
                                            >
                                                Delete Task
                                            </h5>

                                            <button
                                                type="button"
                                                className="btn-close"
                                                aria-label="Close"
                                                disabled={isDeleting}
                                                onClick={() => setShowDeleteModal(false)}
                                            />
                                        </div>

                                        <div className="modal-body">
                                            <p>
                                                Are you sure you want to permanently delete
                                                <strong> {task.title}</strong>?
                                            </p>

                                            <div className="alert alert-warning mb-0">
                                                This action cannot be undone.
                                            </div>
                                            {deleteError && (
                                                <div className="alert alert-danger mt-3 mb-0">
                                                    {deleteError}
                                                </div>
                                            )}
                                        </div>

                                        <div className="modal-footer">
                                            <button
                                                type="button"
                                                className="btn btn-secondary"
                                                onClick={() => setShowDeleteModal(false)}
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                type="button"
                                                className="btn btn-danger"
                                                disabled={isDeleting}
                                                onClick={() => void handleDeleteTask()}
                                            >
                                                {isDeleting ? "Deleting..." : "Delete Permanently"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-backdrop fade show" />
                        </>
                    )}
                </div>
            </div>
            )}
        </div>
    );
};

export default TaskDetailsPage;