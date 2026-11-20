import { getCurrentIdToken } from "../../lib/firebase";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    authRequired?: boolean;
    forceRefreshToken?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, authRequired = false, forceRefreshToken = false } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  const token = await getCurrentIdToken(forceRefreshToken);
  if (authRequired && !token) {
    throw new ApiError("Authentication required.", 401);
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (response.status === 204) return undefined as T;

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      if (response.ok) throw new ApiError("Unexpected non-JSON API response.", 502);
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === "object" && ("error" in payload ? String(payload.error) : "message" in payload ? String(payload.message) : "")) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}
