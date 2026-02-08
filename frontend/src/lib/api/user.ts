import { API_URL } from "./util";

export interface User {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
}

export const getCurrentUser = async (): Promise<User> => {
    const response = await fetch(`${API_URL}/users/me`, {
        method: "GET",
        credentials: "include",
    });

    if (!response.ok) throw new Error("Failed to fetch user data");

    return response.json();
};

export const updateCurrentUser = async (
    name?: string,
    profilePicture?: File,
): Promise<User> => {
    const formData = new FormData();

    if (name) formData.append("name", name);

    if (profilePicture) formData.append("profilePicture", profilePicture);

    const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) throw new Error("Failed to update user");

    return response.json();
};
