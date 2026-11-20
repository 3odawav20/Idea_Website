import { getPhpSession } from "./phpAccounts.ts";

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(code: string, status = 500) {
    super(code);
    this.code = code;
    this.status = status;
  }
}

const marketplaceMethods: Record<string, readonly string[]> = {
  bootstrap: ["GET"],
  search: ["GET"],
  ticker: ["GET"],
  products: ["GET"],
  staff: ["GET"],
  sales: ["GET"],
  "ad-requests": ["GET"],
  "product-save": ["POST"],
  "product-approval": ["POST"],
  "product-active": ["POST"],
  "staff-save": ["POST"],
  "company-status": ["POST"],
  "company-suspend": ["POST"],
  "ticker-save": ["POST"],
  "package-save": ["POST"],
  "ad-request": ["POST"],
  "ad-review": ["POST"],
};
const protectedActions = new Set([
  "bootstrap", "products", "staff", "sales", "ad-requests", "product-save",
  "product-approval", "product-active", "staff-save", "company-status",
  "company-suspend", "ticker-save", "package-save", "ad-request", "ad-review",
]);

export function requireSavedId(value: unknown): string {
  if (
    !value || typeof value !== "object" ||
    (value as { saved?: unknown }).saved !== true ||
    typeof (value as { id?: unknown }).id !== "string" ||
    !/^[a-f0-9]{32}$/.test((value as { id: string }).id)
  ) {
    throw new ApiError("PERSISTENCE_NOT_CONFIRMED", 502);
  }
  return (value as { id: string }).id;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: { method?: string; body?: unknown; authRequired?: boolean } = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const parsedUrl = new URL(url, window.location.origin);
  const action = parsedUrl.searchParams.get("action") || "";
  const allowedMethods = parsedUrl.pathname === "/api/marketplace.php" ? marketplaceMethods[action] : undefined;
  if (parsedUrl.origin !== window.location.origin || !allowedMethods?.includes(method)) {
    throw new ApiError("PHP_API_ROUTE_NOT_VERIFIED", 503);
  }

  const needsSession = options.authRequired || protectedActions.has(action) || method !== "GET";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (needsSession) {
    const session = await getPhpSession();
    if (!session.user) throw new ApiError("AUTHENTICATION_REQUIRED", 401);
    if (method !== "GET") headers["X-CSRF-Token"] = session.csrf;
  }
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(parsedUrl.href, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
    credentials: "same-origin",
  });

  if (response.status === 204) throw new ApiError("EMPTY_API_RESPONSE", 502);

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText.trim()) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      if (response.ok) throw new ApiError("API_RESPONSE_NOT_JSON", 502);
    }
  } else if (response.ok) {
    throw new ApiError("EMPTY_API_RESPONSE", 502);
  }

  if (!response.ok) {
    const responseObject = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
    const responseMessage = responseObject?.error ?? responseObject?.message;
    const message = typeof responseMessage === "string" && responseMessage
      ? responseMessage
      : `REQUEST_FAILED_${response.status}`;
    throw new ApiError(message, response.status);
  }
  if (payload === null) throw new ApiError("EMPTY_API_RESPONSE", 502);
  return payload as T;
}
