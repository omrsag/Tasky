import { useState } from "react";
import type { SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import type { AuthUser } from "../context/AuthContext";

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const navigate = useNavigate();
    const { setToken, setUser } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await axios.post<{
                token: string;
                user: AuthUser;
            }>("/auth/login", {
                email: email.trim(),
                password,
            });

            setToken(response.data.token);
            setUser(response.data.user);

            navigate("/dashboard", { replace: true });
        } catch (error) {
            const message =
                axios.isAxiosError(error) &&
                typeof error.response?.data?.message === "string"
                    ? error.response.data.message
                    : "Login failed. Please try again.";

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
                        Sign in to Tasky
                    </h1>

                    <form onSubmit={handleSubmit}>
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

                        <div className="mb-4">
                            <label htmlFor="password" className="form-label">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                className="form-control"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
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
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="text-center mt-3">
                        Don't have an account?{" "}
                        <Link to="/register">Create an account</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
