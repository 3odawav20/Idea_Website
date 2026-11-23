export const PHP_ACCOUNT_API = "/api/accounts.php";
export const SOCIAL_AUTH_API = "/api/social-auth.php";
export const PHP_PLATFORM_API = "/api/platform.php";

export interface PhpUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: "buyer" | "supplier" | "admin";
  created_at?: number | string;
}

export interface PhpCompany {
  id: string;
  owner_id: string;
  public_name: string;
  legal_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: number | string;
  business_details?: Record<string, unknown>;
}

export interface PhpSession {
  user: PhpUser | null;
  company: PhpCompany | null;
  membership: { audience: string; status: string } | null;
  csrf: string;
}

export type PhpSocialProvider = "google" | "whatsapp" | "facebook" | "apple" | "microsoft" | "x";
export type PhpSocialProviderStatus = Record<PhpSocialProvider, boolean>;
export type PhpOAuthProvider = Exclude<PhpSocialProvider, "whatsapp">;

export const PHP_SOCIAL_PROVIDERS: readonly PhpSocialProvider[] = [
  "google",
  "whatsapp",
  "facebook",
  "apple",
  "microsoft",
  "x",
] as const;

const ALLOWED_REDIRECT_PREFIXES = ["/account", "/favorites", "/request-quote", "/ai-room-visualizer", "/products"] as const;

export function sanitizeSocialRedirect(path?: string): string {
  const candidate = (path || "/account").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return "/account";
  }
  const matched = ALLOWED_REDIRECT_PREFIXES.some((prefix) => candidate === prefix || candidate.startsWith(prefix + "/"));
  return matched ? candidate : "/account";
}

export function getSocialAuthStartUrl(
  provider: PhpOAuthProvider,
  mode: "login" | "register" = "login",
  redirectTo = "/account"
): string {
  const params = new URLSearchParams({
    action: "start",
    provider,
    mode,
    redirect: sanitizeSocialRedirect(redirectTo),
  });
  return `${SOCIAL_AUTH_API}?${params.toString()}`;
}

export interface SocialCallbackNotice {
  kind: "error" | "success";
  code: string;
  provider?: string;
}

export function parseSocialCallbackParams(search: string): SocialCallbackNotice | null {
  const params = new URLSearchParams(search);
  const errorCode = (params.get("social_error") || "").trim().toUpperCase();
  const provider = (params.get("social_provider") || "").trim().toLowerCase() || undefined;
  if (errorCode) {
    return { kind: "error", code: errorCode, provider };
  }
  const statusCode = (params.get("social_status") || "").trim().toUpperCase();
  if (statusCode) {
    return { kind: "success", code: statusCode, provider };
  }
  return null;
}

async function parseAccountResponse(response: Response): Promise<Record<string, unknown>> {
  if (!(response.headers.get("content-type") || "").includes("application/json")) {
    throw new Error("ACCOUNT_API_NON_JSON");
  }
  const data = (await response.json()) as Record<string, unknown>;
  if (!response.ok || data.error) {
    throw new Error(typeof data.error === "string" ? data.error : "ACCOUNT_API_UNAVAILABLE");
  }
  return data;
}

export async function getPhpSession(): Promise<PhpSession> {
  const response = await fetch(PHP_ACCOUNT_API + "?action=session", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const data = await parseAccountResponse(response);
  if (typeof data.csrf !== "string" || data.csrf.length < 20) {
    throw new Error("ACCOUNT_SESSION_MISSING");
  }
  return data as unknown as PhpSession;
}

export async function authenticatePhp(
  action: "register" | "login",
  payload: Record<string, unknown>
): Promise<PhpSession> {
  const current = await getPhpSession();
  const response = await fetch(PHP_ACCOUNT_API + "?action=" + action, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": current.csrf,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseAccountResponse(response);
  const user = data.user as PhpUser | undefined;
  if (!user?.id || !["buyer", "supplier", "admin"].includes(user.role)) {
    throw new Error("ACCOUNT_ROLE_NOT_CONFIRMED");
  }
  return data as unknown as PhpSession;
}

export async function signOutPhp(): Promise<void> {
  const current = await getPhpSession();
  const response = await fetch(PHP_ACCOUNT_API + "?action=logout", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": current.csrf,
    },
    body: "{}",
  });
  await parseAccountResponse(response);
}

export async function uploadBusinessDocument(file: File, kind: string): Promise<void> {
  const current = await getPhpSession();
  if (current.user?.role !== "supplier") throw new Error("COMPANY_SESSION_REQUIRED");
  const data = new FormData();
  data.set("kind", kind);
  data.set("document", file, file.name);
  const response = await fetch(PHP_PLATFORM_API + "?action=company-document-upload", {
    method: "POST",
    credentials: "same-origin",
    headers: { Accept: "application/json", "X-CSRF-Token": current.csrf },
    body: data,
  });
  await parseAccountResponse(response);
}

export interface PhpSocialProvidersInfo {
  providers: PhpSocialProviderStatus;
  googleMode: "oauth" | "gis" | null;
  googleClientId: string | null;
}

export async function socialProviderDetails(): Promise<PhpSocialProvidersInfo> {
  const response = await fetch(SOCIAL_AUTH_API + "?action=providers", {
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const data = await parseAccountResponse(response);
  const flags = data.providers as Record<string, unknown> | undefined;
  // Fail closed: only explicitly confirmed server providers may be enabled.
  const providers: PhpSocialProviderStatus = {
    google: flags?.google === true,
    whatsapp: flags?.whatsapp === true,
    facebook: flags?.facebook === true,
    apple: flags?.apple === true,
    microsoft: flags?.microsoft === true,
    x: flags?.x === true,
  };
  const googleMode =
    data.googleMode === "oauth" || data.googleMode === "gis"
      ? data.googleMode
      : providers.google
      ? "oauth"
      : null;
  const googleClientId =
    typeof data.googleClientId === "string" && data.googleClientId.trim()
      ? data.googleClientId.trim()
      : null;
  return { providers, googleMode, googleClientId };
}

export async function socialProviderStatus(): Promise<PhpSocialProviderStatus> {
  const details = await socialProviderDetails();
  return details.providers;
}

export async function verifyGoogleIdTokenPhp(credential: string): Promise<PhpSession> {
  const current = await getPhpSession();
  const response = await fetch(SOCIAL_AUTH_API + "?action=google-id-token", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": current.csrf,
    },
    body: JSON.stringify({ credential }),
  });
  const data = await parseAccountResponse(response);
  const user = data.user as PhpUser | undefined;
  if (!user?.id || user.role !== "buyer") {
    throw new Error("ACCOUNT_ROLE_NOT_CONFIRMED");
  }
  return data as unknown as PhpSession;
}

export async function sendWhatsAppOtp(
  phoneE164: string,
  mode: "login" | "register"
): Promise<{ expiresInSeconds: number }> {
  const current = await getPhpSession();
  const response = await fetch(SOCIAL_AUTH_API + "?action=whatsapp-send", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": current.csrf,
    },
    body: JSON.stringify({ phone: phoneE164, mode }),
  });
  const data = await parseAccountResponse(response);
  const expires =
    typeof data.expiresInSeconds === "number"
      ? data.expiresInSeconds
      : typeof data.expires_in === "number"
      ? data.expires_in
      : 300;
  return {
    expiresInSeconds: expires,
  };
}

export async function verifyWhatsAppOtp(payload: {
  phone: string;
  code: string;
  mode: "login" | "register";
  name?: string;
}): Promise<PhpSession> {
  const current = await getPhpSession();
  const response = await fetch(SOCIAL_AUTH_API + "?action=whatsapp-verify", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": current.csrf,
    },
    body: JSON.stringify(payload),
  });
  const data = await parseAccountResponse(response);
  const user = data.user as PhpUser | undefined;
  if (!user?.id || user.role !== "buyer") {
    throw new Error("ACCOUNT_ROLE_NOT_CONFIRMED");
  }
  return data as unknown as PhpSession;
}
