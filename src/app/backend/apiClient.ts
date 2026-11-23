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
    csrfToken?: string;
    authRequired?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, csrfToken } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (csrfToken) {
    headers["X-CSRF-Token"] = csrfToken;
  }
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(url, {
    method,
    credentials: "same-origin",
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload &&
        typeof payload === "object" &&
        ("error" in payload
          ? String(payload.error)
          : "message" in payload
          ? String(payload.message)
          : "")) ||
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }
  return payload as T;
}
