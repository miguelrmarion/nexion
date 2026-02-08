// Set the API URL based on the environment (server or client),
// this is important so the containarized middleware can correctly reach the backend service.
export const API_URL =
    typeof window === "undefined"
        ? process.env.SERVER_API_URL || "http://localhost:3001"
        : process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export class ApiError extends Error {
    constructor(
        public info: object,
        public statusCode: number,
    ) {
        super(`Error ${statusCode}: ${info}`);
    }
}

export const fetcher = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`);
    const body = await response.json();
    if (!response.ok) throw new ApiError(body, response.status);

    return body;
};

export const fetcherWithAuth = async <T>(path: string): Promise<T> => {
    const response = await fetch(`${API_URL}${path}`, {
        credentials: "include",
    });

    const body = await response.json();
    if (!response.ok) throw new ApiError(body, response.status);

    return body;
};
