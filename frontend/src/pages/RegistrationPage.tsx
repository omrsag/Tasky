import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";

const RegistrationPage = () => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");

    const navigate = useNavigate();
    const { setToken, setUser } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post<{
                token: string;
                user: AuthUser;
            }>("/auth/register", {
                fullName: fullName.trim(),
                email: email.trim(),
                password,
                workspaceName: workspaceName.trim(),
            });

            setToken(response.data.token);
            setUser(response.data.user);

            navigate("/dashboard", { replace: true });
        } catch (error) {
            const message =
                axios.isAxiosError(error) &&
                typeof error.response?.data?.message === "string"
                    ? error.response.data.message
                    : "Registration failed. Please try again.";

            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container py-5">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-5">
                    <h1 className="h3 mb-4 text-center">
                        Create your Tasky account
                    </h1>

                    <form onSubmit={handleSubmit}>
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
                        {error && (
                            <div className="alert alert-danger" role="alert">
                                {error}
                            </div>
                        )}
                        <button
                            type="submit"
                            className="btn btn-primary w-100"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Creating account..." : "Create Account"}
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
