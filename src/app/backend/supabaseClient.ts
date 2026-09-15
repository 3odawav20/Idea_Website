import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";

/**
 * The browser uses only the public anon key. Service-role credentials must
 * remain in server-side Supabase functions and are intentionally never read
 * by Vite.
 */
// Vercel values take precedence. The connected Make project supplies a safe
// public fallback so the deployed preview does not fail closed merely because
// the two optional Vite variables have not been copied into Vercel yet.
const url = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

export const backendConfigurationError =
  "The production backend is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before enabling account features.";

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
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
