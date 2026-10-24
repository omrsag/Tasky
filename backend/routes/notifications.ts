import express = require("express");
import mysql = require("mysql2");
import db = require("../db");

export function registerNotificationRoutes(app: express.Express): void {
    app.get("/notifications", (req, res) => {
        db.query<mysql.RowDataPacket[]>(
            `SELECT
                id,
                task_id AS taskId,
                type,
                message,
                is_read AS isRead,
                created_at AS createdAt
            FROM notifications
            WHERE recipient_id = ?
            ORDER BY created_at DESC, id DESC`,
            [res.locals.userId],
            (error, results) => {
                if (error) {
                    console.error("Failed to fetch notifications:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                res.status(200).json({
                    notifications: results.map((notification) => ({
                        id: notification.id,
                        taskId: notification.taskId,
                        type: notification.type,
                        message: notification.message,
                        isRead: Boolean(notification.isRead),
                        createdAt: notification.createdAt,
                    })),
                });
            }
        );
    });

    app.get("/notifications/unread-count", (req, res) => {
        db.query<mysql.RowDataPacket[]>(
            `SELECT COUNT(*) AS unreadCount
            FROM notifications
            WHERE recipient_id = ?
                AND is_read = FALSE`,
            [res.locals.userId],
            (error, results) => {
                if (error) {
                    console.error(
                        "Failed to fetch unread notification count:",
                        error
                    );
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                res.status(200).json({
                    unreadCount: Number(results[0].unreadCount),
                });
            }
        );
    });

    app.patch("/notifications/:id/read", (req, res) => {
        const notificationId = Number(req.params.id);

        if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
            res.status(400).json({
                message: "Invalid notification ID",
            });
            return;
        }

        db.query<mysql.ResultSetHeader>(
            `UPDATE notifications
            SET is_read = TRUE
            WHERE id = ? AND recipient_id = ?`,
            [notificationId, res.locals.userId],
            (error, result) => {
                if (error) {
                    console.error("Failed to mark notification as read:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (result.affectedRows === 0) {
                    res.status(404).json({
                        message: "Notification not found",
                    });
                    return;
                }

                res.status(200).json({
                    message: "Notification marked as read",
                });
            }
        );
    });

    app.patch("/notifications/read-all", (req, res) => {
        db.query<mysql.ResultSetHeader>(
            `UPDATE notifications
            SET is_read = TRUE
            WHERE recipient_id = ?
                AND is_read = FALSE`,
            [res.locals.userId],
            (error, result) => {
                if (error) {
                    console.error(
                        "Failed to mark all notifications as read:",
                        error
                    );
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                res.status(200).json({
                    message: "All notifications marked as read",
                });
            }
        );
    });

}
