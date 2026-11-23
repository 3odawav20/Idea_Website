/**
 * Official Google Identity Services (GIS) client helper for IDEA Marketplace.
 * Uses only the scoped public Google OAuth 2.0 Web Client ID (never a secret).
 * ID tokens returned by Google are cryptographically verified server-side against
 * Google's RS256 JWKS endpoint (/api/social-auth.php?action=google-id-token).
 */

const PUBLIC_GOOGLE_CLIENT_ID =
  "248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com";

export const IDEA_GOOGLE_CLIENT_ID: string =
  String(
    (typeof import.meta !== "undefined" &&
      (import.meta as unknown as { env?: Record<string, string | undefined> }).env
        ?.VITE_GOOGLE_CLIENT_ID) ||
      PUBLIC_GOOGLE_CLIENT_ID
  ).trim();

const GOOGLE_CLIENT_ID_PATTERN = /^\d+-[a-z0-9-]+\.apps\.googleusercontent\.com$/i;

export function isValidGoogleClientId(clientId: string | null | undefined): boolean {
  if (!clientId) return false;
  return GOOGLE_CLIENT_ID_PATTERN.test(clientId.trim());
}

export function isProductionIdeaOrigin(hostname?: string): boolean {
  const host = (
    hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "")
  )
    .trim()
    .toLowerCase();
  return host === "idea-dh.com" || host === "www.idea-dh.com";
}

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GooglePromptMoment {
  isNotDisplayed?: () => boolean;
  isSkippedMoment?: () => boolean;
  isDismissedMoment?: () => boolean;
  getNotDisplayedReason?: () => string;
  getDismissedReason?: () => string;
}

interface GoogleAccountsIdApi {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    ux_mode?: "popup" | "redirect";
    use_fedcm_for_prompt?: boolean;
  }) => void;
  prompt: (momentListener?: (notification: GooglePromptMoment) => void) => void;
  cancel?: () => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsIdApi;
      };
    };
  }
}

let gisScriptPromise: Promise<GoogleAccountsIdApi> | null = null;

export function loadGoogleIdentityScript(): Promise<GoogleAccountsIdApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("BROWSER_REQUIRED"));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve(window.google.accounts.id);
  }
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise<GoogleAccountsIdApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );
    const finish = () => {
      if (window.google?.accounts?.id) {
        resolve(window.google.accounts.id);
      } else {
        gisScriptPromise = null;
        reject(new Error("GOOGLE_GIS_UNAVAILABLE"));
      }
    };
    const fail = () => {
      gisScriptPromise = null;
      reject(new Error("GOOGLE_GIS_LOAD_FAILED"));
    };

    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = finish;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

/**
 * Initiates official Google Identity Services sign-in and resolves with a
 * Google-signed RS256 ID Token JWT for server-side verification.
 */
export async function requestGoogleIdToken(
  clientId: string = IDEA_GOOGLE_CLIENT_ID
): Promise<string> {
  if (!isValidGoogleClientId(clientId)) {
    throw new Error("GOOGLE_CLIENT_ID_INVALID");
  }
  const idApi = await loadGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    let settled = false;
    const timeout = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("GOOGLE_SIGNIN_TIMEOUT"));
      }
    }, 60_000);

    idApi.initialize({
      client_id: clientId,
      ux_mode: "popup",
      auto_select: false,
      cancel_on_tap_outside: true,
      use_fedcm_for_prompt: true,
      callback: (response) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        if (response.credential && response.credential.split(".").length === 3) {
          resolve(response.credential);
        } else {
          reject(new Error("GOOGLE_CREDENTIAL_MISSING"));
        }
      },
    });

    idApi.prompt((notification) => {
      if (settled) return;
      if (notification.isNotDisplayed?.()) {
        const reason = notification.getNotDisplayedReason?.() || "";
        settled = true;
        window.clearTimeout(timeout);
        if (reason === "unregistered_origin" || reason === "invalid_client") {
          reject(new Error("GOOGLE_ORIGIN_UNAUTHORIZED"));
        } else {
          reject(new Error("GOOGLE_PROMPT_DISMISSED"));
        }
      } else if (notification.isSkippedMoment?.() || notification.isDismissedMoment?.()) {
        const reason = notification.getDismissedReason?.() || "";
        if (reason !== "credential_returned") {
          settled = true;
          window.clearTimeout(timeout);
          reject(new Error("GOOGLE_PROMPT_DISMISSED"));
        }
      }
    });
  });
}
