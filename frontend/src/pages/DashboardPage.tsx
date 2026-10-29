import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

type Project = {
    id: number;
    name: string;
    status: "Active" | "Completed" | "Archived";
};

type Task = {
    id: number;
    title: string;
    projectId: number;
    assigneeId: number;
    status: "Todo" | "In Progress" | "Review" | "Done";
};

const DashboardPage = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    const { user } = useAuth();

    const todoCount = tasks.filter((task) => task.status === "Todo").length;
    const inProgressCount = tasks.filter((task) => task.status === "In Progress").length;
    const reviewCount = tasks.filter((task) => task.status === "Review").length;
    const doneCount = tasks.filter((task) => task.status === "Done").length;

    const myTasks = tasks.filter(
        (task) => task.assigneeId === user?.id
    );

    const myTasksCount = myTasks.length;

    const summaryCards = [
        { title: "Projects", count: projects.length },
        { title: "Tasks", count: tasks.length },
        { title: "Todo", count: todoCount },
        { title: "In Progress", count: inProgressCount },
        { title: "Review", count: reviewCount },
        { title: "Done", count: doneCount },
    ];

    if (user?.role === "Member") {
        summaryCards.push({
            title: "My Assigned Tasks",
            count: myTasksCount,
        });
    }

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        let active = true;

        const loadProjects = async () => {
            try {
                const response = await axios.get<{ projects: Project[] }>(
                    "/projects"
                );

                const allTasks: Task[] = [];

                for (const project of response.data.projects) {
                    const taskResponse = await axios.get<{ tasks: Task[] }>(
                        `/projects/${project.id}/tasks`
                    );

                    allTasks.push(...taskResponse.data.tasks);
                }

                if (active) {
                    setProjects(response.data.projects);
                    setTasks(allTasks);
                }
            } catch {
                if (active) {
                    setError("Unable to load dashboard data.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadProjects();

        return () => {
            active = false;
        };
    }, [retryCount]);

    return (
        <div>
            <h1 className="h3 mb-3">Dashboard</h1>

            <p className="text-body-secondary">
                Overview of your projects and tasks.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading dashboard...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    <p className="mb-2">{error}</p>

                    <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => setRetryCount((count) => count + 1)}
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <div className="row g-3">
                    {summaryCards.map((card) => (
                        <div className="col-12 col-sm-6 col-lg-4" key={card.title}>
                            <div className="card h-100">
                                <div className="card-body">
                                    <h2 className="h6 text-body-secondary">
                                        {card.title}
                                    </h2>

                                    <p className="fs-3 fw-semibold mb-0">
                                        {card.count}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {projects.length > 0 && tasks.length === 0 && (
                        <div className="col-12">
                            <p className="text-body-secondary mb-0">
                                No tasks available in your projects.
                            </p>
                        </div>
                    )}
                    <div className="col-12 mt-4">
                        <h2 className="h5 mb-3">Projects</h2>

                        {projects.length === 0 ? (
                            <p className="text-body-secondary">
                                No projects available.
                            </p>
                        ) : (
                            <div className="list-group">
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        to={`/projects/${project.id}`}
                                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                    >
                                        <span>{project.name}</span>

                                        <span className="badge text-bg-secondary">
                                            {project.status}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                    {user?.role === "Member" && (
                        <div className="col-12 mt-4">
                            <h2 className="h5 mb-3">My Tasks</h2>

                            {myTasks.length === 0 ? (
                                <p className="text-body-secondary">
                                    No tasks assigned to you.
                                </p>
                            ) : (
                                <div className="list-group">
                                    {myTasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            to={`/tasks/${task.id}`}
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                        >
                                            <span>{task.title}</span>

                                            <span className="badge text-bg-secondary">
                                                {task.status}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
