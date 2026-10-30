import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

type WorkspaceUser = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

const UserDetailsPage = () => {
    const { id } = useParams();

    const [account, setAccount] = useState<WorkspaceUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadUser = async () => {
            setIsLoading(true);
            setError(null);
            setAccount(null);

            if (!id) {
                setError("Invalid user ID.");
                setIsLoading(false);
                return;
            }

            try {
                const response = await axios.get<{
                    user: WorkspaceUser;
                }>(`/users/${id}`);

                if (active) {
                    setAccount(response.data.user);
                }
            } catch {
                if (active) {
                    setError("Unable to load user details.");
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadUser();

        return () => {
            active = false;
        };
    }, [id]);

    return (
        <div>
            <h1 className="h3 mb-3">User Details</h1>

            <p className="text-body-secondary">
                View and manage workspace user details.
            </p>
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading user details...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : account ? (
                <div className="card">
                    <div className="card-body">
                        <h2 className="h5 mb-3">Account Information</h2>

                        <p>
                            <strong>Full Name:</strong> {account.fullName}
                        </p>

                        <p>
                            <strong>Email:</strong> {account.email}
                        </p>

                        <p>
                            <strong>Role:</strong> {account.role}
                        </p>

                        <p className="mb-0">
                            <strong>Status:</strong> {account.status}
                        </p>
                    </div>
                </div>
            ) : (
                <p className="text-body-secondary">
                    User not found.
                </p>
            )}
        </div>
    );
};

export default UserDetailsPage;
