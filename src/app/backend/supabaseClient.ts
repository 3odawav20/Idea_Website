import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Production authentication MUST be configured with a live Supabase project.
 * Never use a generated/deleted project ID or silently fall back to a stale
 * endpoint. Vite's VITE_* values are PUBLIC and may contain only the
 * publishable/anon key — never a service-role or secret key.
 */
const url = String(import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/+$/, "");
const anonKey = String(import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

function isValidAuthEndpoint(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) &&
      !parsed.username && !parsed.password && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

export const backendConfigurationError =
  "Authentication is temporarily unavailable: this site has no working Supabase project configured. The site administrator must configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for an active project and redeploy.";

export const isSupabaseConfigured = isValidAuthEndpoint(url) && Boolean(anonKey);
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error(backendConfigurationError);
  return supabase;
}
