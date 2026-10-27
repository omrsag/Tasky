import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import axios from "axios";

export type AuthUser = {
    id: number;
    fullName: string;
    email: string;
    role: "Admin" | "Manager" | "Member";
    hasProfileImage: boolean;
};

type AuthContextValue = {
    user: AuthUser | null;
    setUser: (user: AuthUser | null) => void;
    token: string | null;
    setToken: (token: string | null) => void;
    isAuthLoading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [token, setStoredToken] = useState<string | null>(
        () => localStorage.getItem("taskyToken")
    );

    const setToken = useCallback((newToken: string | null) => {
        if (newToken) {
            localStorage.setItem("taskyToken", newToken);
        } else {
            localStorage.removeItem("taskyToken");
        }

        setStoredToken(newToken);
    }, []);

    const [isAuthLoading, setIsAuthLoading] = useState(Boolean(token));

    useEffect(() => {
        let active = true;

        const validateSession = async () => {
            if (!token) {
                setUser(null);
                setIsAuthLoading(false);
                return;
            }

            setIsAuthLoading(true);

            try {
                const response = await axios.get<{ user: AuthUser }>("/auth/me");

                if (active) {
                    setUser(response.data.user);
                }
            
            } catch (error) {
                if (active) {
                    setUser(null);

                    if (
                        axios.isAxiosError(error) &&
                        (error.response?.status === 401 ||
                            error.response?.status === 403)
                    ) {
                        setToken(null);
                    }
                }
            } finally {
                if (active) {
                    setIsAuthLoading(false);
                }
            }
        };

        void validateSession();

        return () => {
            active = false;
        };
    }, [token, setToken]);

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, isAuthLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }

    return context;
};
