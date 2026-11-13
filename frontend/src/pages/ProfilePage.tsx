import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
	const { user } = useAuth();

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
		</div>
	);
};

export default ProfilePage;