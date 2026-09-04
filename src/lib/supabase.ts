import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || `https://${projectId}.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || publicAnonKey;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Untyped alias for complex queries where TS generics interfere
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as any;

/** The configured project URL, for display in admin diagnostics. */
export const supabaseProjectUrl = supabaseUrl;

/**
 * Project ref parsed out of the configured URL, so the admin page shows the
 * project it is actually talking to rather than a hardcoded string.
 */
export const supabaseProjectRef =
  supabaseUrl.match(/^https?:\/\/([^.]+)\.supabase\./)?.[1] ?? null;
