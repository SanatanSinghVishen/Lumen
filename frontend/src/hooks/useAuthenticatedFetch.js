import { useAuth } from "@clerk/clerk-react";

/**
 * Returns a fetch wrapper that automatically attaches
 * the Clerk JWT to every request as a Bearer token.
 *
 * Usage:
 *   const authFetch = useAuthenticatedFetch();
 *   const res = await authFetch("/research", { method: "POST", body: ... });
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();
  const API_URL = import.meta.env.VITE_API_URL;

  return async (path, options = {}) => {
    const token = await getToken();
    return fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
        ...options.headers,
      },
    });
  };
}
