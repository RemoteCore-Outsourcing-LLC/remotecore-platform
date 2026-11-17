import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyNewAccount } from "@/lib/email/notify";

// Email links (confirm sign up, reset password) land here and become a login.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/portal";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  if (code) {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (!error && data.user?.email_confirmed_at) await notifyNewAccount(data.user.id);
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
