import { UserProfile, Solution, UserRankProfile } from "@/types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export function getToken(): string | null {
    if (typeof window === "undefined") return null;

    // First try to get from localStorage (for backward compatibility)
    const localToken = localStorage.getItem("auth_token");
    if (localToken) return localToken;

    // If not in localStorage, try to get from cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'auth_token') {
            return value;
        }
    }

    return null;
}

export function setToken(token: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem("auth_token", token);
    }
}

export function removeToken() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        // Clear the auth cookie
        document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
}

export function getUserFromToken(): UserProfile | null {
    const token = getToken();
    if (!token) return null;
    try {
        // Decode the base64 payload of the JWT
        const payloadBase64 = token.split(".")[1];
        if (!payloadBase64) {
            console.error("Invalid JWT format");
            removeToken();
            return null;
        }

        // Handle base64url encoding (replace characters and pad if needed)
        const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
        const padding = '='.repeat((4 - base64.length % 4) % 4);
        const decodedJson = atob(base64 + padding);
        const claims = JSON.parse(decodedJson);

        // Check expiration with buffer time
        const now = Date.now();
        const expTime = claims.exp * 1000;
        if (expTime <= now) {
            console.warn("Token expired");
            removeToken();
            return null;
        }

        // Validate required fields
        if (!claims.uid || !claims.email) {
            console.error("Invalid token claims: missing required fields");
            removeToken();
            return null;
        }

        // Map Go claims to our expected Next.js UserProfile structure
        return {
            uid: claims.uid,
            email: claims.email || null,
            displayName: claims.name || null,
            photoURL: claims.picture || null,
            // Rank and points from the backend JWT
            rank: claims.rank || 'F',
            points: claims.points || 0,
        };
    } catch (error) {
        console.error("Failed to parse JWT", error);
        removeToken();
        return null;
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = getToken();
    const headers = new Headers(options.headers);
    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
        removeToken();
        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            if (!currentPath.startsWith("/login")) {
                window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=true`;
            }
        }
        throw new Error("Authentication required");
    }

    if (!response.ok) {
        console.log(response)
        let errorMessage = `HTTP error ${response.status}`;

        try {
            const data = await response.json();
            errorMessage = data.error || errorMessage;
        } catch {
            const text = await response.text();
            if (text) errorMessage = text;
        }

        throw new Error(errorMessage);
    }

    // Handle empty bodies safely (e.g., 204 No Content)
    if (response.status === 204 || response.headers.get("content-length") === "0") {
        return {} as T;
    }

    const text = await response.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
}

// Solution API functions
export const solutionsApi = {
    // Check if user can submit solution to a problem
    checkCanSolve: (problemId: string) =>
        api.get<{ canSubmit: boolean; reason: string }>(`/problems/${problemId}/can-solve`),

    // Submit a new solution
    submit: (problemId: string, solution: Partial<Solution>) =>
        api.post<Solution>(`/problems/${problemId}/solutions`, solution),

    // Get all solutions for a problem
    getByProblem: (problemId: string) =>
        api.get<Solution[]>(`/problems/${problemId}/solutions`),

    // Get a single solution by ID
    getById: (solutionId: string) =>
        api.get<Solution>(`/solutions/${solutionId}`),

    // Update a solution (owner only)
    update: (solutionId: string, solution: Partial<Solution>) =>
        api.put<Solution>(`/solutions/${solutionId}`, solution),

    // Delete a solution (owner only)
    delete: (solutionId: string) =>
        api.delete<void>(`/solutions/${solutionId}`),

    // Accept a solution (problem owner only)
    accept: (solutionId: string) =>
        api.post<Solution>(`/solutions/${solutionId}/accept`),

    // Recommend a solution (problem owner only)
    recommend: (solutionId: string) =>
        api.post<Solution>(`/solutions/${solutionId}/recommend`),

    // Vote on a solution (toggle)
    vote: (solutionId: string) =>
        api.post<{ voted: boolean }>(`/solutions/${solutionId}/vote`),
};

// User rank API functions
export const rankApi = {
    // Get current user's rank profile
    getMyRank: () =>
        api.get<UserRankProfile>("/me/rank"),
};

export const api = {
    get: <T>(endpoint: string, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "GET" }),

    post: <T>(endpoint: string, body?: any, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "POST", body: body ? JSON.stringify(body) : undefined }),

    put: <T>(endpoint: string, body?: any, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "PUT", body: body ? JSON.stringify(body) : undefined }),

    delete: <T>(endpoint: string, options?: RequestInit) =>
        request<T>(endpoint, { ...options, method: "DELETE" }),
};

// Auth API functions
export const authApi = {
    logout: () =>
        api.post<{ message: string }>("/auth/logout"),
};
