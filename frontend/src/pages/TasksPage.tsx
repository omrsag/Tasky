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
    const [searchInput, setSearchInput] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("");
    const [assigneeFilter, setAssigneeFilter] = useState("");

    useEffect(() => {
        let active = true;

        const fetchTasks = async () => {
            setIsLoading(true);
            setError(null);
            setTasks([]);

            try {
                const response = await axios.get<{ tasks: Task[] }>(
                    `/projects/${id}/tasks`,
                    {
                        params: {
                            ...(appliedSearch
                                ? { search: appliedSearch }
                                : {}),
                            ...(statusFilter
                                ? { status: statusFilter }
                                : {}),
                            ...(priorityFilter
                                ? { priority: priorityFilter }
                                : {}),
                            ...(assigneeFilter
                                ? { assigneeId: Number(assigneeFilter) }
                                : {}),
                        },
                    }
                );

                if (active) {
                    setTasks(response.data.tasks);
                }
            } catch (error) {
                if (!active) return;

                if (axios.isAxiosError<{ message: string }>(error)) {
                    setError(
                        error.response?.data?.message ||
                        "Unable to load project tasks."
                    );
                } else {
                    setError("Unable to load project tasks.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void fetchTasks();

        return () => {
            active = false;
        };
    }, [id, appliedSearch, statusFilter, priorityFilter, assigneeFilter]);

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

    const today = new Date();

    const todayDate = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

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
            <form
                className="d-flex flex-wrap align-items-center gap-2 mb-3"
                onSubmit={(event) => {
                    event.preventDefault();
                    setAppliedSearch(searchInput.trim());
                }}
            >
                <input
                    type="search"
                    className="form-control"
                    placeholder="Search tasks..."
                    aria-label="Search tasks"
                    style={{ maxWidth: 350 }}
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                />

                <button
                    type="submit"
                    className="btn btn-primary"
                >
                    Search
                </button>

                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => {
                        setSearchInput("");
                        setAppliedSearch("");
                        setStatusFilter("");
                        setPriorityFilter("");
                        setAssigneeFilter("");
                    }}
                >
                    Clear All
                </button>
            </form>
            <div className="d-flex flex-wrap gap-3 mb-3">
                <div>
                    <label htmlFor="statusFilter" className="form-label">
                        Status
                    </label>

                    <select
                        id="statusFilter"
                        className="form-select"
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="Todo">Todo</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Review">Review</option>
                        <option value="Done">Done</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="priorityFilter" className="form-label">
                        Priority
                    </label>

                    <select
                        id="priorityFilter"
                        className="form-select"
                        value={priorityFilter}
                        onChange={(event) => setPriorityFilter(event.target.value)}
                    >
                        <option value="">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="assigneeFilter" className="form-label">
                        Assigned Member
                    </label>

                    <select
                        id="assigneeFilter"
                        className="form-select"
                        value={assigneeFilter}
                        onChange={(event) => setAssigneeFilter(event.target.value)}
                        disabled={isLoadingMembers || !!membersError}
                    >
                        <option value="">All Members</option>

                        {members.map((member) => (
                            <option key={member.id} value={member.id}>
                                {member.fullName}
                            </option>
                        ))}
                    </select>
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
                    {appliedSearch || statusFilter || priorityFilter || assigneeFilter
                        ? "No tasks match the selected search and filters."
                        : "No tasks found for this project."}
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

                                        {task.dueDate &&
                                            task.dueDate.slice(0, 10) < todayDate &&
                                            task.status !== "Done" && (
                                                <span className="badge bg-danger ms-2">
                                                    Overdue 
                                                </span>
                                            )
                                        }
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
