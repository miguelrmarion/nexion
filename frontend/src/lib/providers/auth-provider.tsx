"use client";

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import { verifyToken } from "../api/auth";
import { getCurrentUser, User } from "../api/user";

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
    refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    refetchUser: async () => {},
});

interface AuthProviderProps {
    children: ReactNode;
    token: string;
}

export function AuthProvider({ token, children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [user, setUser] = useState<User | null>(null);

    const fetchUser = async () => {
        try {
            const userData = await getCurrentUser();
            setUser(userData);
        } catch (error) {
            setUser(null);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const tokenValidResponse = await verifyToken(token);
                const authenticated = tokenValidResponse.ok;
                setIsAuthenticated(authenticated);

                if (authenticated) await fetchUser();
            } catch (error) {
                setIsAuthenticated(false);
                setUser(null);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                isLoading: loading,
                user,
                refetchUser: fetchUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined)
        throw new Error("useAuth must be used within an AuthProvider");

    return context;
}
