import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import axios from "axios";

const ProfilePage = () => {
	const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

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
		</div>
	);
};

export default ProfilePage;