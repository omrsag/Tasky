import { useAuth } from "../context/AuthContext";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

const ProfilePage = () => {
	const { user, setUser } = useAuth();
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [imageError, setImageError] = useState("");
    const [imageSuccess, setImageSuccess] = useState("");
    const [isRemovingImage, setIsRemovingImage] = useState(false);
    const [profileImage, setProfileImage] = useState<{
        userId: number;
        url: string;
    } | null>(null);

    const [isImageLoading, setIsImageLoading] = useState(false);
    const [profileImageError, setProfileImageError] = useState("");
    const [imageRefreshKey, setImageRefreshKey] = useState(0);

    const handleChangePassword = async () => {
        if (isChangingPassword) return;

        setPasswordError("");
        setPasswordSuccess("");

        if (!currentPassword) {
            setPasswordError("Current password is required.");
            return;
        }

        if (newPassword.length < 8) {
            setPasswordError("New password must be at least 8 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setIsChangingPassword(true);

        try {
            const response = await axios.patch<{ message: string }>(
                "/auth/password",
                {
                    currentPassword,
                    newPassword,
                }
            );

            setPasswordSuccess(response.data.message);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setPasswordError(
                    error.response?.data?.message ||
                    "Unable to change password."
                );
            } else {
                setPasswordError("Unable to change password.");
            }
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleUploadProfileImage = async () => {
        if (isUploadingImage || isRemovingImage) return;

        setImageError("");
        setImageSuccess("");

        if (!selectedImage) {
            setImageError("Please select an image.");
            return;
        }

        const allowedFormats: Record<string, string[]> = {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
        };

        const extension = selectedImage.name.match(/\.[^.]+$/)?.[0]?.toLowerCase();

        if (!extension || !allowedFormats[selectedImage.type]?.includes(extension)) {
            setImageError("Please select a JPEG, PNG, WebP, or GIF image.");
            return;
        }

        setIsUploadingImage(true);

        const formData = new FormData();
        formData.append("file", selectedImage);

        try {
            const response = await axios.post<{
                message: string;
                hasProfileImage: boolean;
            }>("/auth/profile-image", formData);

            if (user) {
                setUser({
                    ...user,
                    hasProfileImage: response.data.hasProfileImage,
                });
            }

            setImageRefreshKey((current) => current + 1);
            setImageSuccess(response.data.message);
            setSelectedImage(null);

            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setImageError(
                    error.response?.data?.message ||
                    "Unable to upload profile image."
                );
            } else {
                setImageError("Unable to upload profile image.");
            }
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleRemoveProfileImage = async () => {
        if (isRemovingImage || isUploadingImage || !user?.hasProfileImage) return;

        setImageError("");
        setImageSuccess("");
        setIsRemovingImage(true);

        try {
            const response = await axios.delete<{
                message: string;
                hasProfileImage: boolean;
            }>("/auth/profile-image");

            setUser({
                ...user,
                hasProfileImage: response.data.hasProfileImage,
            });

            setImageSuccess(response.data.message);
            setSelectedImage(null);

            if (imageInputRef.current) {
                imageInputRef.current.value = "";
            }
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setImageError(
                    error.response?.data?.message ||
                    "Unable to remove profile image."
                );
            } else {
                setImageError("Unable to remove profile image.");
            }
        } finally {
            setIsRemovingImage(false);
        }
    };

    useEffect(() => {
        if (!user?.hasProfileImage) {
            setProfileImage(null);
            setIsImageLoading(false);
            setProfileImageError("");
            return;
        }

        let isActive = true;
        let objectUrl: string | null = null;

        const fetchProfileImage = async () => {
            setIsImageLoading(true);
            setProfileImageError("");
            setProfileImage(null);

            try {
                const response = await axios.get<Blob>(
                    "/auth/profile-image",
                    {
                        responseType: "blob",
                    }
                );

                if (!isActive) return;

                objectUrl = URL.createObjectURL(response.data);

                setProfileImage({
                    userId: user.id,
                    url: objectUrl,
                });
            } catch (error) {
                if (!isActive) return;

                if (
                    axios.isAxiosError(error) &&
                    error.response?.status === 404
                ) {
                    setProfileImageError("Profile picture not found.");
                } else {
                    setProfileImageError("Unable to load profile picture.");
                }
            } finally {
                if (isActive) {
                    setIsImageLoading(false);
                }
            }
        };

        void fetchProfileImage();

        return () => {
            isActive = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [user?.id, user?.hasProfileImage, imageRefreshKey]);

	if (!user) {
		return (
			<div className="alert alert-warning" role="alert">
				Profile information is unavailable.
			</div>
		);
	}

	return (
		<div>
			<h2 className="mb-4">My Profile</h2>

			<div className="card">
				<div className="card-body">
					<dl className="row mb-0">
						<dt className="col-sm-3">Full Name</dt>
						<dd className="col-sm-9">{user.fullName}</dd>

						<dt className="col-sm-3">Email</dt>
						<dd className="col-sm-9">{user.email}</dd>

						<dt className="col-sm-3">Role</dt>
						<dd className="col-sm-9">{user.role}</dd>
					</dl>
				</div>
			</div>
            <div className="card mt-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">Change Password</h5>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleChangePassword();
                        }}
                    >
                        <div className="mb-3">
                            <label htmlFor="currentPassword" className="form-label">
                                Current Password
                            </label>
                            <input
                                id="currentPassword"
                                type="password"
                                className="form-control"
                                value={currentPassword}
                                onChange={(event) => setCurrentPassword(event.target.value)}
                                autoComplete="current-password"
                                required
                                disabled={isChangingPassword}
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="newPassword" className="form-label">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                className="form-control"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                                disabled={isChangingPassword}
                            />
                            <div className="form-text">
                                Must be at least 8 characters.
                            </div>
                        </div>

                        <div className="mb-3">
                            <label htmlFor="confirmPassword" className="form-label">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="form-control"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                                disabled={isChangingPassword}
                            />
                        </div>

                        {passwordError && (
                            <div className="alert alert-danger" role="alert">
                                {passwordError}
                            </div>
                        )}

                        {passwordSuccess && (
                            <div className="alert alert-success" role="status">
                                {passwordSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={isChangingPassword}
                        >
                            {isChangingPassword ? "Changing..." : "Change Password"}
                        </button>
                    </form>
                </div>
            </div>
            <div className="card mt-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">Profile Picture</h5>

                    {!user.hasProfileImage && (
                        <div
                            className="rounded-circle bg-body-tertiary border text-secondary-emphasis d-flex align-items-center justify-content-center fw-semibold mb-3"
                            style={{
                                width: 120,
                                height: 120,
                                fontSize: 48,
                            }}
                            role="img"
                            aria-label="Default profile avatar"
                        >
                            {user.fullName.trim().charAt(0).toUpperCase() || "?"}
                        </div>
                    )}
                    {user.hasProfileImage && (
                        <div className="mb-3">
                            {isImageLoading ? (
                                <p className="text-body-secondary">
                                    Loading profile picture...
                                </p>
                            ) : profileImageError ? (
                                <div className="alert alert-warning" role="alert">
                                    {profileImageError}
                                </div>
                            ) : profileImage?.userId === user.id ? (
                                <img
                                    src={profileImage.url}
                                    alt="Your profile"
                                    className="rounded-circle border"
                                    style={{
                                        width: 120,
                                        height: 120,
                                        objectFit: "cover",
                                    }}
                                />
                            ) : null}
                        </div>
                    )}
                    <p className="text-body-secondary">
                        {user.hasProfileImage
                            ? "You already have a profile picture. Upload a new image to replace it."
                            : "You have not uploaded a profile picture yet."}
                    </p>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            void handleUploadProfileImage();
                        }}
                    >
                        <div className="mb-3">
                            <label htmlFor="profileImage" className="form-label">
                                Choose Image
                            </label>

                            <input
                                ref={imageInputRef}
                                id="profileImage"
                                type="file"
                                className="form-control"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={(event) => {
                                    setSelectedImage(event.target.files?.[0] ?? null);
                                    setImageError("");
                                    setImageSuccess("");
                                }}
                                disabled={isUploadingImage || isRemovingImage}
                            />

                            <div className="form-text">
                                Supported formats: JPEG, PNG, WebP, GIF.
                            </div>
                        </div>

                        {imageError && (
                            <div className="alert alert-danger" role="alert">
                                {imageError}
                            </div>
                        )}

                        {imageSuccess && (
                            <div className="alert alert-success" role="status">
                                {imageSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-outline-primary"
                            disabled={isUploadingImage || isRemovingImage || !selectedImage}
                        >
                            {isUploadingImage
                                ? "Uploading..."
                                : user.hasProfileImage
                                    ? "Replace Picture"
                                    : "Upload Picture"}
                        </button>
                    </form>
                    {user.hasProfileImage && (
                        <button
                            type="button"
                            className="btn btn-outline-danger btn-sm mt-3"
                            onClick={() => void handleRemoveProfileImage()}
                            disabled={isRemovingImage || isUploadingImage}
                        >
                            {isRemovingImage ? "Removing..." : "Remove Picture"}
                        </button>
                    )}
                </div>
            </div>
		</div>
	);
};

export default ProfilePage;