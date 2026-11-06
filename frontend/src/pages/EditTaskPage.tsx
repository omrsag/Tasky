import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type Task = {
	id: number;
	projectId: number;
	title: string;
	description: string | null;
	priority: "Low" | "Medium" | "High";
	assigneeId: number;
	dueDate: string | null;
	status: "Todo" | "In Progress" | "Review" | "Done";
};

type ProjectMember = {
	id: number;
	fullName: string;
	email: string;
	role: string;
	status: string;
};

type Project = {
	id: number;
	managerId: number;
	status: "Active" | "Completed" | "Archived";
};

const EditTaskPage = () => {
	const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [task, setTask] = useState<Task | null>(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [assigneeId, setAssigneeId] = useState("");
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTask = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setTask(null);

                const response = await axios.get<{ task: Task }>(
                    `/tasks/${id}`
                );

                const currentTask = response.data.task;

                setTask(currentTask);
                setAssigneeId(String(currentTask.assigneeId));
                setTitle(currentTask.title);
                setDescription(currentTask.description || "");
                setPriority(currentTask.priority);
                setDueDate(
                    currentTask.dueDate
                        ? currentTask.dueDate.slice(0, 10)
                        : ""
                );
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setError(
                        error.response?.data?.message ||
                        "Unable to load task information."
                    );
                } else {
                    setError("Unable to load task information.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        void fetchTask();
    }, [id]);

    const projectId = task?.projectId;

    useEffect(() => {
        if (!projectId) return;

        const fetchMembers = async () => {
            try {
                setIsLoadingMembers(true);
                setMembersError(null);
                setMembers([]);

                const response = await axios.get<{ members: ProjectMember[] }>(
                    `/projects/${projectId}/members`
                );

                const eligibleMembers = response.data.members.filter(
                    (member) => member.role === "Member" && member.status === "Active"
                );

                setMembers(eligibleMembers);
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
    }, [projectId]);

    useEffect(() => {
        if (!projectId) return;

        const fetchProject = async () => {
            try {
                setIsLoadingProject(true);
                setProjectError(null);
                setProject(null);

                const response = await axios.get<{ project: Project }>(
                    `/projects/${projectId}`
                );

                setProject(response.data.project);
            } catch {
                setProjectError("Unable to load project information.");
            } finally {
                setIsLoadingProject(false);
            }
        };

        void fetchProject();
    }, [projectId]);

    const canEditTask =
        project?.id === task?.projectId &&
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" && user.id === project.managerId));
          
    const handleSaveTask = async () => {
        if (
            !task ||
            !canEditTask ||
            !id ||
            !title.trim() ||
            !assigneeId ||
            isLoadingMembers ||
            membersError !== null ||
            !members.some((member) => member.id === Number(assigneeId)) ||
            isSaving
        ) {
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            await axios.patch(`/tasks/${id}`, {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                assigneeId: Number(assigneeId),
                dueDate: dueDate || null
            });

            navigate(`/tasks/${id}`);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setSaveError(
                    error.response?.data?.message ||
                    "Unable to update task."
                );
            } else {
                setSaveError("Unable to update task.");
            }
        } finally {
            setIsSaving(false);
        }
    };

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>Edit Task</h2>

				<Link
					to={`/tasks/${id}`}
					className="btn btn-outline-secondary"
				>
					Back to Task Details
				</Link>
			</div>
            {isLoading ? (
                <p>Loading task...</p>
            ) : error ? (
                <div className="alert alert-danger">
                    {error}
                </div>
            ) : !task ? (
                <div className="alert alert-warning">
                    Task not found.
                </div>
            ) : isLoadingProject ? (
                <p>Loading project...</p>
            ) : projectError ? (
                <div className="alert alert-danger">
                    {projectError}
                </div>
            ) : !canEditTask ? (
                <div className="alert alert-warning">
                    You do not have permission to edit this task, or the project is read-only.
                </div>
            ) : (
                <form
                    className="card card-body"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveTask();
                    }}
                >
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">
                            Title
                        </label>

                        <input
                            id="title"
                            type="text"
                            className="form-control"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
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
                            rows={4}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="priority" className="form-label">
                            Priority
                        </label>

                        <select
                            id="priority"
                            className="form-select"
                            value={priority}
                            onChange={(event) => setPriority(event.target.value)}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                    
                    <div className="mb-3">
                        <label htmlFor="assignee" className="form-label">
                            Assignee
                        </label>

                        <select
                            id="assignee"
                            className="form-select"
                            value={assigneeId}
                            onChange={(event) => setAssigneeId(event.target.value)}
                            disabled={isLoadingMembers || membersError !== null || members.length === 0}
                            required
                        >
                            <option value="">
                                {isLoadingMembers ? "Loading members..." : "Select assignee"}
                            </option>

                            {members.map((member) => (
                                <option key={member.id} value={member.id}>
                                    {member.fullName} ({member.email})
                                </option>
                            ))}
                        </select>

                        {membersError && (
                            <div className="text-danger mt-2">
                                {membersError}
                            </div>
                        )}

                        {!isLoadingMembers && !membersError && members.length === 0 && (
                            <div className="text-muted mt-2">
                                No eligible members available for this project.
                            </div>
                        )}
                    </div>

                    <div className="mb-3">
                        <label htmlFor="dueDate" className="form-label">
                            Due Date
                        </label>

                        <input
                            id="dueDate"
                            type="date"
                            className="form-control"
                            value={dueDate}
                            onChange={(event) => setDueDate(event.target.value)}
                        />
                    </div>
                    {saveError && (
                        <div className="alert alert-danger">
                            {saveError}
                        </div>
                    )}

                    <div className="d-flex justify-content-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                isSaving ||
                                !title.trim() ||
                                !assigneeId ||
                                isLoadingMembers ||
                                membersError !== null ||
                                !members.some((member) => member.id === Number(assigneeId))
                            }
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            )}
		</div>
	);
};

export default EditTaskPage;