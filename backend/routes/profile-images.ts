
import express = require("express");
import mysql = require("mysql2");
import db = require("../db");
import path = require("path");
import multer = require("multer");
import fs = require("fs");
import { profileImageUpload } from "../middleware/uploads";

export function registerProfileImageRoutes(app: express.Express): void {
    app.get("/auth/profile-image", (_req, res) => {
        const userId = res.locals.userId;
        const workspaceId = res.locals.workspaceId;

        db.query<mysql.RowDataPacket[]>(
            `SELECT profile_image_path AS profileImagePath
             FROM users
             WHERE id = ? AND workspace_id = ?
             LIMIT 1`,
            [userId, workspaceId],
            (error, users) => {
                if (error) {
                    console.error("Failed to fetch profile image:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (users.length === 0) {
                    res.status(404).json({
                        message: "User not found",
                    });
                    return;
                }

                const storedPath = users[0].profileImagePath;

                if (storedPath === null) {
                    res.status(404).json({
                        message: "Profile image not found",
                    });
                    return;
                }

                if (
                    typeof storedPath !== "string" ||
                    !storedPath.trim()
                ) {
                    res.status(500).json({
                        message: "Invalid profile image path",
                    });
                    return;
                }

                const backendRoot = path.resolve(__dirname, "../..");

                const profileImagesRoot = path.join(
                    backendRoot,
                    "uploads",
                    "profile-images"
                );

                const fullPath = path.isAbsolute(storedPath)
                    ? path.resolve(storedPath)
                    : path.resolve(backendRoot, storedPath);

                if (!fullPath.startsWith(profileImagesRoot + path.sep)) {
                    console.error("Invalid profile image path:", fullPath);
                    res.status(500).json({
                        message: "Invalid profile image path",
                    });
                    return;
                }

                res.sendFile(fullPath, (error) => {
                    if (!error) {
                        return;
                    }

                    console.error("Failed to send profile image:", error);

                    if (res.headersSent) {
                        res.end();
                        return;
                    }

                    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                        res.status(404).json({
                            message: "Profile image file not found",
                        });
                        return;
                    }

                    res.status(500).json({
                        message: "Something went wrong",
                    });
                });
            }
        );
    });

    app.post("/auth/profile-image", (req, res) => {
        const userId = res.locals.userId;
        const workspaceId = res.locals.workspaceId;

        db.query<mysql.RowDataPacket[]>(
            `SELECT profile_image_path AS profileImagePath
            FROM users
            WHERE id = ? AND workspace_id = ?
            LIMIT 1`,
            [userId, workspaceId],
            (error, users) => {
                if (error) {
                    console.error("Failed to fetch user profile:", error);
                    res.status(500).json({
                        message: "Something went wrong",
                    });
                    return;
                }

                if (users.length === 0) {
                    res.status(404).json({ message: "User not found" });
                    return;
                }

                const oldStoredPath = users[0].profileImagePath;
                const backendRoot = path.resolve(__dirname, "../..");
                const profileImagesRoot = path.join(
                    backendRoot,
                    "uploads",
                    "profile-images"
                );

                let oldFullPath: string | null = null;

                if (oldStoredPath !== null) {
                    if (
                        typeof oldStoredPath !== "string" ||
                        !oldStoredPath.trim()
                    ) {
                        res.status(500).json({
                            message: "Invalid profile image path",
                        });
                        return;
                    }

                    const resolvedPath = path.isAbsolute(oldStoredPath)
                        ? path.resolve(oldStoredPath)
                        : path.resolve(backendRoot, oldStoredPath);

                    if (!resolvedPath.startsWith(profileImagesRoot + path.sep)) {
                        res.status(500).json({
                            message: "Invalid profile image path",
                        });
                        return;
                    }

                    oldFullPath = resolvedPath;
                }

                profileImageUpload.single("file")(req, res, (uploadError) => {
                    if (uploadError) {
                        if (uploadError instanceof multer.MulterError) {
                            res.status(400).json({
                                message: "Invalid image upload",
                            });
                            return;
                        }

                        console.error("Failed to upload profile image:", uploadError);
                        res.status(500).json({
                            message: "Something went wrong",
                        });
                        return;
                    }

                    const file = req.file;

                    if (!file) {
                        res.status(400).json({
                            message: "Profile image is required",
                        });
                        return;
                    }

                    const allowedFormats: Record<string, string[]> = {
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                        "image/webp": [".webp"],
                        "image/gif": [".gif"],
                    };

                    const extension = path.extname(file.originalname).toLowerCase();

                    if (!allowedFormats[file.mimetype]?.includes(extension)) {
                        fs.unlink(file.path, (cleanupError) => {
                            if (cleanupError && cleanupError.code !== "ENOENT") {
                                console.error("Image cleanup failed:", cleanupError);
                            }

                            res.status(400).json({
                                message: "Unsupported profile image format",
                            });
                        });
                        return;
                    }

                    const newStoredPath =
                        `uploads/profile-images/${file.filename}`;

                    db.query<mysql.ResultSetHeader>(
                        `UPDATE users
                        SET profile_image_path = ?
                        WHERE id = ? AND workspace_id = ?`,
                        [newStoredPath, userId, workspaceId],
                        (error, result) => {
                            if (error) {
                                console.error("Failed to save profile image:", error);
                            }

                            if (error || result.affectedRows === 0) {
                                fs.unlink(file.path, (cleanupError) => {
                                    if (
                                        cleanupError &&
                                        cleanupError.code !== "ENOENT"
                                    ) {
                                        console.error(
                                            "Image cleanup failed:",
                                            cleanupError
                                        );
                                    }

                                    res.status(error ? 500 : 404).json({
                                        message: error
                                            ? "Something went wrong"
                                            : "User not found",
                                    });
                                });
                                return;
                            }

                            if (!oldFullPath) {
                                res.status(200).json({
                                    message: "Profile image updated successfully",
                                    hasProfileImage: true,
                                });
                                return;
                            }

                            fs.unlink(oldFullPath, (cleanupError) => {
                                if (
                                    cleanupError &&
                                    cleanupError.code !== "ENOENT"
                                ) {
                                    console.error(
                                        "Previous image cleanup failed:",
                                        cleanupError
                                    );

                                    res.status(500).json({
                                        message:
                                            "Profile image updated, but previous file cleanup failed",
                                    });
                                    return;
                                }

                                res.status(200).json({
                                    message: "Profile image updated successfully",
                                    hasProfileImage: true,
                                });
                            });
                        }
                    );
                });
            }
        );
    });

}
