import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);

    const [token, setStoredToken] = useState<string | null>(
        () => localStorage.getItem("taskyToken")
    );

    const setToken = (newToken: string | null) => {
        if (newToken) {
            localStorage.setItem("taskyToken", newToken);
        } else {
            localStorage.removeItem("taskyToken");
        }

        setStoredToken(newToken);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken }}>
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
