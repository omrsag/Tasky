import { useState } from "react";
import { Link } from "react-router-dom";

const RegistrationPage = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <h1 className="h3 mb-4 text-center">
                        Create your Tasky account
                    </h1>

                    <form onSubmit={(event) => event.preventDefault()}>
                        <div className="mb-3">
                            <label htmlFor="fullName" className="form-label">
                                Full Name
                            </label>
                            <input
                                id="fullName"
                                type="text"
                                className="form-control"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                autoComplete="name"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="email" className="form-label">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="form-control"
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="workspaceName" className="form-label">
                                Workspace Name
                            </label>
                            <input
                                id="workspaceName"
                                type="text"
                                className="form-control"
                                value={workspaceName}
                                onChange={(event) => setWorkspaceName(event.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled
                        >
                            Create Account
                        </button>
                    </form>

                    <p className="text-center mt-3">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegistrationPage;
