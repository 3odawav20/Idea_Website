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
async function parseAccountResponse(response: Response): Promise<Record<string, unknown>> {
  if (!(response.headers.get("content-type") || "").includes("application/json")) throw new Error("ACCOUNT_API_NON_JSON");
  const data = await response.json() as Record<string, unknown>;
  if (!response.ok || data.error) throw new Error(typeof data.error === "string" ? data.error : "ACCOUNT_API_UNAVAILABLE");
  return data;
}
export async function getPhpSession(): Promise<PhpSession> {
  // Hosting Nginx cached the bare ?action=session response by User-Agent and
  // served a shared CSRF value WITHOUT a Set-Cookie header (X-Proxy-Cache:HIT).
  // A fresh cache key on every request forces the genuine PHP session response.
  // This is intentionally cryptographically random, including post-OAuth.
  const nonce = crypto.randomUUID();
  const response = await fetch(PHP_ACCOUNT_API + "?action=session&nonce=" + encodeURIComponent(nonce), {
    credentials:"same-origin", cache:"no-store",
    headers: { Accept: "application/json", "Cache-Control": "no-cache, no-store", Pragma: "no-cache" }
  });
  const data = await parseAccountResponse(response);
  if (typeof data.csrf !== "string" || data.csrf.length < 20) throw new Error("ACCOUNT_SESSION_MISSING");
  return data as unknown as PhpSession;
}
export async function authenticatePhp(action:"register"|"login", payload:Record<string,unknown>):Promise<PhpSession> {
  const current = await getPhpSession();
  const response = await fetch(PHP_ACCOUNT_API + "?action=" + action, {
    method:"POST", credentials:"same-origin",
    headers:{"Content-Type":"application/json",Accept:"application/json","X-CSRF-Token":current.csrf},
    body:JSON.stringify(payload)
  });
  const data = await parseAccountResponse(response);
  const user = data.user as PhpUser | undefined;
  if (!user?.id || !["buyer","supplier","admin"].includes(user.role)) throw new Error("ACCOUNT_ROLE_NOT_CONFIRMED");
  return data as unknown as PhpSession;
}
export async function signOutPhp():Promise<void> {
  const current=await getPhpSession();
  const response=await fetch(PHP_ACCOUNT_API+"?action=logout", {
    method:"POST",credentials:"same-origin",
    headers:{"Content-Type":"application/json",Accept:"application/json","X-CSRF-Token":current.csrf},body:"{}"
  });
  await parseAccountResponse(response);
}
export async function uploadBusinessDocument(file:File,kind:string):Promise<void> {
  const current=await getPhpSession();
  if (current.user?.role!=="supplier") throw new Error("COMPANY_SESSION_REQUIRED");
  const data=new FormData();
  data.set("kind",kind); data.set("document",file,file.name);
  const response=await fetch(PHP_PLATFORM_API+"?action=company-document-upload", {
    method:"POST",credentials:"same-origin",
    headers:{Accept:"application/json","X-CSRF-Token":current.csrf},body:data
  });
  await parseAccountResponse(response);
}
export type PhpSocialProvider = "google" | "facebook" | "apple" | "x" | "microsoft" | "whatsapp";
export type PhpSocialProviderStatus = Record<PhpSocialProvider, boolean>;

export async function socialProviderStatus(): Promise<PhpSocialProviderStatus> {
  const response = await fetch(SOCIAL_AUTH_API + "?action=providers", {
    credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" }
  });
  const data = await parseAccountResponse(response);
  const flags = data.providers as Record<string, unknown> | undefined;
  // Only server-confirmed providers may be enabled. Missing values remain false.
  return {
    google: flags?.google === true,
    facebook: flags?.facebook === true,
    apple: flags?.apple === true,
    x: flags?.x === true,
    microsoft: flags?.microsoft === true,
    whatsapp: flags?.whatsapp === true
  };
}
