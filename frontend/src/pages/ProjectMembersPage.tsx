import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

type ProjectMember = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    status: "Active" | "Disabled";
};

type AvailableMember = {
    id: number;
    fullName: string;
    email: string;
};

type ProjectSummary = {
    managerId: number;
    status: "Active" | "Completed" | "Archived";
};

const ProjectMembersPage = () => {    
    const { id } = useParams();
    const { user } = useAuth();

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [project, setProject] = useState<ProjectSummary | null>(null);
    const [availableMembers, setAvailableMembers] = useState<AvailableMember[]>([]);
    const [isLoadingAvailableMembers, setIsLoadingAvailableMembers] = useState(false);
    const [availableMembersError, setAvailableMembersError] = useState<string | null>(null);
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [addMemberError, setAddMemberError] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);  
    const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
    const [removeError, setRemoveError] = useState<string | null>(null);
    const [memberToRemove, setMemberToRemove] = useState<ProjectMember | null>(null);

    useEffect(() => {
        let active = true;

        const loadMembers = async () => {
            setIsLoading(true);
            setError(null);
            setMembers([]);
            setProject(null);

            if (!id || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
                setError("Invalid project ID.");
                setIsLoading(false);
                return;
            }

            try {                
                const projectResponse = await axios.get<{
                    project: ProjectSummary;
                }>(`/projects/${id}`);

                const response = await axios.get<{
                    members: ProjectMember[];
                }>(`/projects/${id}/members`);

                if (active) {
                    setMembers(response.data.members);
                    setProject(projectResponse.data.project);
                }
            } catch (error) {
                if (active) {
                    if (axios.isAxiosError<{ message: string }>(error)) {
                        setError(
                            error.response?.data?.message ||
                            "Unable to load project members."
                        );
                    } else {
                        setError("Unable to load project members.");
                    }
                }
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        };

        void loadMembers();

        return () => {
            active = false;
        };
    }, [id, refreshKey]);

    const canManageMembers =
        project?.status === "Active" &&
        (user?.role === "Admin" ||
            (user?.role === "Manager" &&
                user.id === project.managerId));

    useEffect(() => {
        if (!canManageMembers || !id) {
            setAvailableMembers([]);
            setAvailableMembersError(null);
            return;
        }

        let active = true;

        const loadAvailableMembers = async () => {
            setIsLoadingAvailableMembers(true);
            setAvailableMembersError(null);
            setAvailableMembers([]);

            try {
                const response = await axios.get<{
                    availableMembers: AvailableMember[];
                }>(`/projects/${id}/available-members`);

                if (active) {
                    setAvailableMembers(response.data.availableMembers);
                }
            } catch (error) {
                if (active) {
                    if (axios.isAxiosError<{ message: string }>(error)) {
                        setAvailableMembersError(
                            error.response?.data?.message ||
                            "Unable to load available members."
                        );
                    } else {
                        setAvailableMembersError("Unable to load available members.");
                    }
                }
            } finally {
                if (active) {
                    setIsLoadingAvailableMembers(false);
                }
            }
        };

        void loadAvailableMembers();

        return () => {
            active = false;
        };
    }, [id, canManageMembers, refreshKey]);

    const handleAddMember = async () => {
        if (!canManageMembers || !id || isAddingMember) return;

        setAddMemberError(null);

        const userId = Number(selectedMemberId);

        if (
            !Number.isSafeInteger(userId) ||
            !availableMembers.some((member) => member.id === userId)
        ) {
            setAddMemberError("Please select a valid member.");
            return;
        }

        setIsAddingMember(true);

        try {
            await axios.post(`/projects/${id}/members`, {
                userId,
            });

            setSelectedMemberId("");
            setRefreshKey((previous) => previous + 1);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setAddMemberError(
                    error.response?.data?.message ||
                    "Unable to add project member."
                );
            } else {
                setAddMemberError("Unable to add project member.");
            }
        } finally {
            setIsAddingMember(false);
        }
    };

    const handleRemoveMember = async () => {
        const member = memberToRemove;

        if (!member || !canManageMembers || !id || removingMemberId !== null) {
            return;
        }

        setRemoveError(null);
        setRemovingMemberId(member.id);

        try {
            await axios.delete(
                `/projects/${id}/members/${member.id}`
            );

            setRefreshKey((previous) => previous + 1);
            setMemberToRemove(null);
        } catch (error) {
            if (axios.isAxiosError<{ message: string }>(error)) {
                setRemoveError(
                    error.response?.data?.message ||
                    "Unable to remove project member."
                );
            } else {
                setRemoveError("Unable to remove project member.");
            }
        } finally {
            setRemovingMemberId(null);
        }
    };

    return (
        <div>
            <h1 className="h3 mb-3">Project Members</h1>

            <p className="text-body-secondary">
                View and manage members of this project.
            </p>
            {!isLoading && !error && project && (
                <p className="text-body-secondary">
                    {project.status !== "Active"
                        ? "This project is read-only. Members cannot be added or removed."
                        : canManageMembers
                            ? "You can manage the members of this project."
                            : "You can view members, but cannot change membership."}
                </p>
            )}
            {canManageMembers && (
                <div className="card mb-3">
                    <div className="card-body">
                        <h2 className="h5 mb-3">Available Members</h2>

                        {isLoadingAvailableMembers ? (
                            <p className="text-body-secondary" role="status">
                                Loading available members...
                            </p>
                        ) : availableMembersError ? (
                            <div className="alert alert-danger" role="alert">
                                {availableMembersError}
                            </div>
                        ) : (
                            <>
                                <p className="text-body-secondary">
                                    {availableMembers.length} eligible members available to add.
                                </p>

                                {addMemberError && (
                                    <div className="alert alert-danger" role="alert">
                                        {addMemberError}
                                    </div>
                                )}

                                {availableMembers.length > 0 && (
                                    <form
                                        onSubmit={(event) => {
                                            event.preventDefault();
                                            void handleAddMember();
                                        }}
                                    >
                                        <div className="mb-3">
                                            <label
                                                htmlFor="selectedMember"
                                                className="form-label"
                                            >
                                                Select Member
                                            </label>

                                            <select
                                                id="selectedMember"
                                                className="form-select"
                                                value={selectedMemberId}
                                                onChange={(event) =>
                                                    setSelectedMemberId(event.target.value)
                                                }
                                                disabled={isAddingMember}
                                                required
                                            >
                                                <option value="">
                                                    Select a Member
                                                </option>

                                                {availableMembers.map((member) => (
                                                    <option
                                                        key={member.id}
                                                        value={member.id}
                                                    >
                                                        {member.fullName} ({member.email})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={isAddingMember || !selectedMemberId}
                                        >
                                            {isAddingMember ? "Adding..." : "Add Member"}
                                        </button>
                                    </form>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
            {isLoading ? (
                <p className="text-body-secondary" role="status">
                    Loading project members...
                </p>
            ) : error ? (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            ) : members.length === 0 ? (
                <div className="alert alert-info">
                    No members have been added to this project yet.
                </div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-striped align-middle">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                {canManageMembers && <th>Actions</th>}
                            </tr>
                        </thead>

                        <tbody>
                            {members.map((member) => (
                                <tr key={member.id}>
                                    <td>{member.fullName}</td>
                                    <td>{member.email}</td>
                                    {canManageMembers && (
                                        <td>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => {
                                                    setRemoveError(null);
                                                    setMemberToRemove(member);
                                                }}
                                                disabled={removingMemberId !== null}
                                            >
                                                {removingMemberId === member.id
                                                    ? "Removing..."
                                                    : "Remove"}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {memberToRemove && (
                <>
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="removeMemberModalTitle"
                        onKeyDown={(event) => {
                            if (event.key === "Escape" && removingMemberId === null) {
                                setMemberToRemove(null);
                            }
                        }}
                    >
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2
                                        className="modal-title fs-5"
                                        id="removeMemberModalTitle"
                                    >
                                        Remove Project Member
                                    </h2>

                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Close"
                                        disabled={removingMemberId !== null}
                                        onClick={() => setMemberToRemove(null)}
                                    />
                                </div>

                                <div className="modal-body">
                                    <p className="mb-0">
                                        Are you sure you want to remove{" "}
                                        <strong>{memberToRemove.fullName}</strong>{" "}
                                        from this project?
                                    </p>

                                    {removeError && (
                                        <div className="alert alert-danger mt-3 mb-0" role="alert">
                                            {removeError}
                                        </div>
                                    )}
                                </div>

                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        autoFocus
                                        disabled={removingMemberId !== null}
                                        onClick={() => setMemberToRemove(null)}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="button"
                                        className="btn btn-danger"
                                        disabled={removingMemberId !== null}
                                        onClick={() => void handleRemoveMember()}
                                    >
                                        {removingMemberId !== null
                                            ? "Removing..."
                                            : "Remove Member"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="modal-backdrop fade show" />
                </>
            )}
        </div>
    );
};

export default ProjectMembersPage;
