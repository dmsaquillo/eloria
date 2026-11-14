
import { CONFIG } from "./config";
import { getAccessToken } from "./auth";

interface FetchOptions extends RequestInit {
  requiresAuth?: boolean;
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const {
    requiresAuth = false,
    headers,
    ...restOptions
  } = options;

  const requestHeaders = new Headers(headers);

  requestHeaders.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = getAccessToken();

    if (!token) {
      throw new Error("Unauthorized. Please log in again.");
    }

    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    `${CONFIG.API_BASE_URL}${endpoint}`,
    {
      ...restOptions,
      headers: requestHeaders,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    const errorMessage = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || "An unexpected error occurred.";

    throw new Error(errorMessage);
  }

  return data as T;
}
