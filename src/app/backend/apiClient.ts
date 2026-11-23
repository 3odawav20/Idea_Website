import { getPhpSession } from "./phpAccounts";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.status = status;
  }
}

/** Same-origin PHP/MySQL API transport; there is no Firebase bearer identity. */
export async function apiFetch<T = unknown>(
  url: string,
  options: {
    method?: string;
    body?: unknown;
    authRequired?: boolean;
    forceRefreshToken?: boolean; // legacy callers; intentionally ignored
  } = {}
): Promise<T> {
  if (!url.startsWith("/") || url.startsWith("//")) {
    throw new ApiError("Only same-origin API endpoints are allowed.", 400);
  }
  const { method = "GET", body, authRequired = false } = options;
  const verb = method.toUpperCase();
  const mutating = !["GET", "HEAD", "OPTIONS"].includes(verb);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (authRequired || mutating) {
    const session = await getPhpSession();
    if (authRequired && !session.user) throw new ApiError("Authentication required.", 401);
    if (mutating) headers["X-CSRF-Token"] = session.csrf;
  }
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const response = await fetch(url, {
    method: verb,
    credentials: "same-origin",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
    redirect: "error",
  });
  if (!(response.headers.get("content-type") || "").includes("application/json")) {
    throw new ApiError("PHP API returned a non-JSON response.", response.status || 502);
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || (payload && typeof payload === "object" && "error" in payload)) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String(payload.error)
      : `Request failed (${response.status})`;
    throw new ApiError(error, response.status);
  }
  return payload as T;
}
