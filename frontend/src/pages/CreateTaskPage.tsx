import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
    startDate: string | null;
    endDate: string | null;
};

const CreateTaskPage = () => {
	const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");
    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [assigneeId, setAssigneeId] = useState("");
    const [isLoadingMembers, setIsLoadingMembers] = useState(true);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [isLoadingProject, setIsLoadingProject] = useState(true);
    const [projectError, setProjectError] = useState<string | null>(null);
    const [isCreatingTask, setIsCreatingTask] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setIsLoadingMembers(true);
                setMembersError(null);
                setMembers([]);
                setAssigneeId("");

                const response = await axios.get<{ members: ProjectMember[] }>(
                    `/projects/${id}/members`
                );

                const eligibleMembers = response.data.members.filter(
                    (member) => member.role === "Member" && member.status === "Active"
                );

                setMembers(eligibleMembers);
            } catch {
                setMembersError("Unable to load project members.");
            } finally {
                setIsLoadingMembers(false);
            }
        };

        void fetchMembers();
    }, [id]);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setIsLoadingProject(true);
                setProjectError(null);
                setProject(null);

                const response = await axios.get<{ project: Project }>(
                    `/projects/${id}`
                );

                setProject(response.data.project);
            } catch {
                setProjectError("Unable to load project information.");
            } finally {
                setIsLoadingProject(false);
            }
        };

        void fetchProject();
    }, [id]);

    const canCreateTask =
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" && user.id === project.managerId));

    const assigneeError =
        assigneeId !== "" &&
        !isLoadingMembers &&
        membersError === null &&
        !members.some((member) => member.id === Number(assigneeId))
            ? "Selected assignee is not eligible for this project."
            : null;
            
    let dueDateError: string | null = null;

    if (
        dueDate &&
        project?.startDate &&
        dueDate < project.startDate.slice(0, 10)
    ) {
        dueDateError = `Due Date cannot be before ${project.startDate.slice(0, 10)}.`;
    } else if (
        dueDate &&
        project?.endDate &&
        dueDate > project.endDate.slice(0, 10)
    ) {
        dueDateError = `Due Date cannot be after ${project.endDate.slice(0, 10)}.`;
    }

    const handleCreateTask = async () => {
        if (
            !canCreateTask ||
            !id ||
            !title.trim() ||
            !assigneeId ||
            isLoadingMembers ||
            dueDateError !== null ||
            assigneeError !== null ||
            isCreatingTask
        ) {
            return;
        }

        try {
            setIsCreatingTask(true);
            setCreateError(null);

            await axios.post(`/projects/${id}/tasks`, {
                title: title.trim(),
                description: description.trim() || null,
                priority,
                assigneeId: Number(assigneeId),
                dueDate: dueDate || null
            });

            navigate(`/projects/${id}/tasks`);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setCreateError(
                    error.response?.data?.message || "Unable to create task."
                );
            } else {
                setCreateError("Unable to create task.");
            }
        } finally {
            setIsCreatingTask(false);
        }
    };

	return (
		<div>
			<div className="d-flex justify-content-between align-items-center mb-4">
				<h2>Create Task</h2>

				<Link
					to={`/projects/${id}/tasks`}
					className="btn btn-outline-secondary"
				>
					Back to Project Tasks
				</Link>
			</div>
            {isLoadingProject ? (
                <p>Loading project...</p>
            ) : projectError ? (
                <div className="alert alert-danger">
                    {projectError}
                </div>
            ) : !canCreateTask ? (
                <div className="alert alert-warning">
                    You do not have permission to create tasks in this project.
                </div>
            ) : (
                <form
                    className="card card-body"
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleCreateTask();
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
                            required
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
                        {assigneeError && (
                            <div className="text-danger mt-2" role="alert">
                                {assigneeError}
                            </div>
                        )}
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
                        {dueDateError && (
                            <div className="text-danger mt-2" role="alert">
                                {dueDateError}
                            </div>
                        )}
                    </div>
                    {createError && (
                        <div className="alert alert-danger">
                            {createError}
                        </div>
                    )}

                    <div className="d-flex justify-content-end">
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                isCreatingTask ||
                                !title.trim() ||
                                !assigneeId ||
                                dueDateError !== null ||
                                assigneeError !== null ||
                                isLoadingMembers
                            }
                        >
                            {isCreatingTask ? "Creating..." : "Create Task"}
                        </button>
                    </div>
                </form>
            )}
		</div>
	);
};

export default CreateTaskPage;
