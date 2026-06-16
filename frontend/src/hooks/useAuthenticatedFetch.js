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
    
    const headers = {
      "Authorization": `Bearer ${token}`,
      ...options.headers,
    };

    // Set application/json as default, unless we're sending FormData
    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    return fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  };
}
