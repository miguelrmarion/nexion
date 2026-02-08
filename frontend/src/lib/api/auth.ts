import { API_URL } from "./util";

export interface TokenResponse {
    token: string;
}

export const loginUser = async (
    username: string,
    password: string,
): Promise<Response> => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password }),
    });

    return response;
};

export const checkAuthStatus = async (): Promise<boolean> => {
    const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        credentials: "include",
    });

    return response.ok;
};

export const registerUser = async (
    username: string,
    email: string,
    password: string,
) => {
    return await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ username, password, email }),
    });
};

export interface RefreshTokenResponse {
    token: string;
}
export const refreshToken = async () => {
    return await fetch(`${API_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
    });
};

// Token should be defined if called from middleware (server),
// if called from client it will be sent by credentials: "include"
export const verifyToken = async (token: string | undefined) => {
    return await fetch(`${API_URL}/users/me`, {
        method: "GET",
        headers: {
            Cookie: `auth_token=${token}`,
        },
        credentials: "include",
    });
};

export const logoutUser = async () => {
    return await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
};
