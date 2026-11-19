import "server-only";
import { createClient } from "@supabase/supabase-js";

// Server only. Uses the service role key, which skips row level security.
// Never import this file into a client component.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// False on a computer without the database keys (no .env.local). Public pages then build with the built in text.
export const hasDbKeys = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
