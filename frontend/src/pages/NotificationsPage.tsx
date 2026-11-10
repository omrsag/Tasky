import { useEffect, useState } from "react";
import axios from "axios";

type TaskNotification = {
	id: number;
	taskId: number;
	type:
		| "TaskAssigned"
		| "TaskSubmittedForReview"
		| "TaskApproved"
		| "TaskReturned"
		| "NewComment";
	message: string;
	isRead: boolean;
	createdAt: string;
};

const NotificationsPage = () => {
	const [notifications, setNotifications] = useState<TaskNotification[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState("");

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                setIsLoading(true);
                setError("");

                const response = await axios.get<{
                    notifications: TaskNotification[];
                }>("/notifications");

                setNotifications(response.data.notifications);
            } catch (error) {
                if (axios.isAxiosError<{ message: string }>(error)) {
                    setError(
                        error.response?.data?.message ||
                        "Unable to load notifications."
                    );
                } else {
                    setError("Unable to load notifications.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        void fetchNotifications();
    }, []);

	return (
		<div>
			<h2 className="mb-4">Notifications</h2>
            {isLoading ? (
                <p>Loading notifications...</p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : notifications.length === 0 ? (
                <p className="text-muted">No notifications yet.</p>
            ) : (
                <div className="list-group">
                    {notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className="list-group-item"
                        >
                            <p className="mb-2 text-break">
                                {notification.message}
                            </p>

                            <small className="text-muted">
                                {new Date(notification.createdAt).toLocaleString()}
                            </small>
                        </div>
                    ))}
                </div>
            )}
		</div>
	);
};

export default NotificationsPage;