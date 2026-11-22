import type { SupabaseClient } from "@supabase/supabase-js";

export const backendConfigurationError =
  "BLOCKED: Supabase is not the verified IDEA account or commerce backend. Only server-confirmed PHP/MySQL routes may be used; unsupported operations remain disabled.";

export const isSupabaseConfigured = false;
function getUnavailableSupabaseClient(): SupabaseClient | null {
  return null;
}
export const supabase = getUnavailableSupabaseClient();

export function requireSupabase(): SupabaseClient {
  throw new Error(backendConfigurationError);
}
