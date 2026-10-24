
import multer = require("multer");
import fs = require("fs");
import path = require("path");
import crypto = require("crypto");

const uploadsRoot = path.resolve(__dirname, "../../uploads");

const attachmentsDirectory = path.join(
    uploadsRoot,
    "attachments"
);

const profileImagesDirectory = path.join(
    uploadsRoot,
    "profile-images"
);

fs.mkdirSync(attachmentsDirectory, { recursive: true });
fs.mkdirSync(profileImagesDirectory, { recursive: true });

function createStorage(directory: string): multer.StorageEngine {
    return multer.diskStorage({
        destination: (_req, _file, callback) => {
            callback(null, directory);
        },
        filename: (_req, file, callback) => {
            const extension = path.extname(file.originalname);
            const fileName = crypto.randomUUID() + extension;

            callback(null, fileName);
        },
    });
}

export const attachmentUpload = multer({
    storage: createStorage(attachmentsDirectory),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
});

export const profileImageUpload = multer({
    storage: createStorage(profileImagesDirectory),
});
