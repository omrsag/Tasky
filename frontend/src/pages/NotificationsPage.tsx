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
    const [markingNotificationId, setMarkingNotificationId] = useState<number | null>(null);
    const [isMarkingAll, setIsMarkingAll] = useState(false);
    const [actionError, setActionError] = useState("");

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

    const handleMarkAsRead = async (notificationId: number) => {
        setMarkingNotificationId(notificationId);
        setActionError("");

        try {
            await axios.patch(`/notifications/${notificationId}/read`);

            setNotifications((current) =>
                current.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, isRead: true }
                        : notification
                )
            );
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setActionError(
                    error.response?.data?.message ||
                    "Unable to mark notification as read."
                );
            } else {
                setActionError("Unable to mark notification as read.");
            }
        } finally {
            setMarkingNotificationId(null);
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarkingAll(true);
        setActionError("");

        try {
            await axios.patch("/notifications/read-all");

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    isRead: true,
                }))
            );
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setActionError(
                    error.response?.data?.message ||
                    "Unable to mark all notifications as read."
                );
            } else {
                setActionError("Unable to mark all notifications as read.");
            }
        } finally {
            setIsMarkingAll(false);
        }
    };

	return (
		<div>
			<div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                <h2 className="mb-0">Notifications</h2>

                {!isLoading && !error && notifications.some((notification) => !notification.isRead) && (
                    <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => void handleMarkAllAsRead()}
                        disabled={isMarkingAll || markingNotificationId !== null}
                    >
                        {isMarkingAll ? "Marking..." : "Mark all as read"}
                    </button>
                )}
            </div>

            {actionError && (
                <div className="alert alert-danger" role="alert">
                    {actionError}
                </div>
            )}
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
                            className={`list-group-item ${
                                notification.isRead ? "" : "bg-body-tertiary"
                            }`}
                        >
                            <p
                                className={`mb-2 text-break ${
                                    notification.isRead ? "" : "fw-semibold"
                                }`}
                            >
                                {notification.message}
                            </p>
                            {!notification.isRead && (
                                <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                    <span className="badge text-bg-primary mb-2">
                                        Unread
                                    </span>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
                                        onClick={() => void handleMarkAsRead(notification.id)}
                                        disabled={markingNotificationId !== null || isMarkingAll}
                                    >
                                        {markingNotificationId === notification.id
                                            ? "Marking..."
                                            : "Mark as read"}
                                    </button>
                                </div>
                            )}
                            <small className="d-block text-muted">
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