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

type TaskComment = {
	id: number;
	taskId: number;
	authorId: number;
	authorName: string;
	content: string;
	createdAt: string;
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
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentsError, setCommentsError] = useState("");
    const [newComment, setNewComment] = useState("");
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [addCommentError, setAddCommentError] = useState("");
    const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
    const [editedCommentContent, setEditedCommentContent] = useState("");
    const [isSavingComment, setIsSavingComment] = useState(false);
    const [editCommentError, setEditCommentError] = useState("");
    const [commentToDeleteId, setCommentToDeleteId] = useState<number | null>(null);
    const [isDeletingComment, setIsDeletingComment] = useState(false);
    const [deleteCommentError, setDeleteCommentError] = useState("");

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

    useEffect(() => {
        if (!id) return;

        const fetchComments = async () => {
            setIsLoadingComments(true);
            setCommentsError("");
            setComments([]);

            try {
                const response = await axios.get<{ comments: TaskComment[] }>(
                    `/tasks/${id}/comments`
                );

                setComments(response.data.comments);
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setCommentsError(
                        error.response?.data?.message ||
                        "Failed to load comments."
                    );
                } else {
                    setCommentsError("Failed to load comments.");
                }
            } finally {
                setIsLoadingComments(false);
            }
        };

        fetchComments();
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

    const canReviewTask =
        canEditTask &&
        task?.status === "Review";

    const canChangeOwnTaskStatus =
        task !== null &&
        project?.id === task.projectId &&
        project.status === "Active" &&
        user?.role === "Member" &&
        user.id === task.assigneeId;

    const handleChangeTaskStatus = async (
        nextStatus: "Todo" | "In Progress" | "Review" | "Done"
    ) => {
        if (!task || isUpdatingStatus) {
            return;
        }

        const isValidMemberTransition =
            canChangeOwnTaskStatus &&
            ((task.status === "Todo" && nextStatus === "In Progress") ||
                (task.status === "In Progress" &&
                    (nextStatus === "Todo" || nextStatus === "Review")));

        const isValidReviewTransition =
            canReviewTask &&
            (nextStatus === "Done" || nextStatus === "In Progress");

        const isValidManagerTransition =
            canEditTask &&
            ((task.status === "Todo" && nextStatus === "In Progress") ||
                (task.status === "In Progress" &&
                    (nextStatus === "Todo" || nextStatus === "Review")));
            
        if (
            !isValidMemberTransition &&
            !isValidReviewTransition &&
            !isValidManagerTransition
        ) {
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

    const handleAddComment = async () => {
        const content = newComment.trim();

        if (
            !task ||
            !project ||
            project.id !== task.projectId ||
            project.status !== "Active" ||
            !content ||
            isAddingComment
        ) {
            return;
        }

        try {
            setIsAddingComment(true);
            setAddCommentError("");

            await axios.post(`/tasks/${task.id}/comments`, {
                content
            });

            setNewComment("");

            const response = await axios.get<{ comments: TaskComment[] }>(
                `/tasks/${task.id}/comments`
            );

            setComments(response.data.comments);
            setCommentsError("");
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setAddCommentError(
                    error.response?.data?.message ||
                    "Unable to add comment or refresh comments."
                );
            } else {
                setAddCommentError("Unable to add comment or refresh comments.");
            }
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleSaveComment = async () => {
        const content = editedCommentContent.trim();

        const commentToEdit = comments.find(
            (comment) => comment.id === editingCommentId
        );

        if (
            !task ||
            !project ||
            project.id !== task.projectId ||
            project.status !== "Active" ||
            !commentToEdit ||
            commentToEdit.authorId !== user?.id ||
            !content ||
            isSavingComment
        ) {
            return;
        }

        try {
            setIsSavingComment(true);
            setEditCommentError("");

            await axios.patch(`/comments/${commentToEdit.id}`, {
                content
            });

            const response = await axios.get<{ comments: TaskComment[] }>(
                `/tasks/${task.id}/comments`
            );

            setComments(response.data.comments);
            setEditingCommentId(null);
            setEditedCommentContent("");
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setEditCommentError(
                    error.response?.data?.message ||
                    "Unable to save or refresh comment."
                );
            } else {
                setEditCommentError("Unable to save or refresh comment.");
            }
        } finally {
            setIsSavingComment(false);
        }
    };

    const handleDeleteComment = async () => {
        const commentToDelete = comments.find(
            (comment) => comment.id === commentToDeleteId
        );

        if (
            !task ||
            !project ||
            project.id !== task.projectId ||
            project.status !== "Active" ||
            !commentToDelete ||
            !(canEditTask || user?.id === commentToDelete.authorId) ||
            isDeletingComment
        ) {
            return;
        }

        try {
            setIsDeletingComment(true);
            setDeleteCommentError("");

            await axios.delete(`/comments/${commentToDelete.id}`);

            setComments((previousComments) =>
                previousComments.filter(
                    (comment) => comment.id !== commentToDelete.id
                )
            );

            setCommentToDeleteId(null);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setDeleteCommentError(
                    error.response?.data?.message ||
                    "Unable to delete comment."
                );
            } else {
                setDeleteCommentError("Unable to delete comment.");
            }
        } finally {
            setIsDeletingComment(false);
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

    const today = new Date();

    const todayDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    const isOverdue =
        task?.dueDate != null &&
        task.dueDate.slice(0, 10) < todayDate &&
        task.status !== "Done";

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
                    {canEditTask && task.status === "Todo" && (
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
                    {canEditTask && task.status === "In Progress" && (
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
                    {canReviewTask && (
                        <div className="d-flex gap-2 mb-3">
                            <button
                                type="button"
                                className="btn btn-success"
                                disabled={isUpdatingStatus}
                                onClick={() => void handleChangeTaskStatus("Done")}
                            >
                                Approve Task
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline-warning"
                                disabled={isUpdatingStatus}
                                onClick={() => void handleChangeTaskStatus("In Progress")}
                            >
                                Return to In Progress
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

                        {isOverdue && (
                            <span className="badge bg-danger ms-2">
                                Overdue
                            </span>
                        )}
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
                    <hr className="my-4" />

                    <h5 className="mb-3">Comments</h5>
                    {project?.id === task.projectId && project.status === "Active" && (
                        <div className="mb-3">
                            <label htmlFor="newComment" className="form-label">
                                New Comment
                            </label>

                            <textarea
                                id="newComment"
                                className="form-control"
                                rows={3}
                                placeholder="Write a comment..."
                                value={newComment}
                                onChange={(event) => setNewComment(event.target.value)}
                            />
                            {addCommentError && (
                                <div className="alert alert-danger mt-2">
                                    {addCommentError}
                                </div>
                            )}

                            <button
                                type="button"
                                className="btn btn-primary mt-2"
                                disabled={isAddingComment || !newComment.trim()}
                                onClick={() => void handleAddComment()}
                            >
                                {isAddingComment ? "Adding..." : "Add Comment"}
                            </button>
                        </div>
                    )}
                    {isLoadingComments ? (
                        <p>Loading comments...</p>
                    ) : commentsError ? (
                        <div className="alert alert-danger">
                            {commentsError}
                        </div>
                    ) : comments.length === 0 ? (
                        <p className="text-muted">No comments yet.</p>
                    ) : (
                        <div className="list-group">
                            {comments.map((comment) => (
                                <div
                                    key={comment.id}
                                    className="list-group-item"
                                >
                                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                                        <strong>{comment.authorName}</strong>

                                        <small className="text-muted">
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </small>
                                    </div>

                                    {editingCommentId === comment.id ? (
                                        <div>
                                            <textarea
                                                className="form-control"
                                                rows={3}
                                                value={editedCommentContent}
                                                onChange={(event) => setEditedCommentContent(event.target.value)}
                                            />
                                            {editCommentError && (
                                                <div className="alert alert-danger mt-2">
                                                    {editCommentError}
                                                </div>
                                            )}

                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm mt-2 me-2"
                                                disabled={isSavingComment || !editedCommentContent.trim()}
                                                onClick={() => void handleSaveComment()}
                                            >
                                                {isSavingComment ? "Saving..." : "Save Changes"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm mt-2"
                                                disabled={isSavingComment}
                                                onClick={() => {
                                                    setEditCommentError("");
                                                    setEditingCommentId(null);
                                                    setEditedCommentContent("");
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p
                                                className="mb-0 text-break"
                                                style={{ whiteSpace: "pre-wrap" }}
                                            >
                                                {comment.content}
                                            </p>

                                            {project?.id === task.projectId &&
                                                project.status === "Active" &&
                                                user?.id === comment.authorId && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-primary btn-sm mt-2"
                                                        onClick={() => {
                                                            setEditCommentError("");
                                                            setEditingCommentId(comment.id);
                                                            setEditedCommentContent(comment.content);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )
                                            }
                                            {project?.id === task.projectId &&
                                                project.status === "Active" &&
                                                (canEditTask || user?.id === comment.authorId) && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger btn-sm mt-2 ms-2"
                                                        onClick={() => {
                                                            setDeleteCommentError("");
                                                            setCommentToDeleteId(comment.id);
                                                        }}
                                                        disabled={isDeletingComment}
                                                    >
                                                        Delete
                                                    </button>
                                                )
                                            }
                                            {commentToDeleteId === comment.id && (
                                                <div className="alert alert-warning mt-2 mb-0">
                                                    <p className="mb-2">
                                                        Are you sure you want to permanently delete this comment?
                                                    </p>
                                                    {deleteCommentError && (
                                                        <div className="alert alert-danger">
                                                            {deleteCommentError}
                                                        </div>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-secondary btn-sm"
                                                        onClick={() => {
                                                            setDeleteCommentError("");
                                                            setCommentToDeleteId(null);
                                                        }}
                                                        disabled={isDeletingComment}
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm ms-2"
                                                        disabled={isDeletingComment}
                                                        onClick={() => void handleDeleteComment()}
                                                    >
                                                        {isDeletingComment ? "Deleting..." : "Delete Permanently"}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
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