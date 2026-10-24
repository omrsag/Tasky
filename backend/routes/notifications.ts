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
}
