import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { notifyNewAccount } from "@/lib/email/notify";

// Links in the confirm and reset password emails land here. They carry a one time token_hash,
// so they work in any browser or device, not only the one that asked for the email.
const TYPES: EmailOtpType[] = ["email", "signup", "recovery", "invite", "magiclink", "email_change"];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  if (token_hash && type && TYPES.includes(type)) {
    const sb = await supabaseServer();
    const { data, error } = await sb.auth.verifyOtp({ token_hash, type });
    if (!error && data.user) {
      if (type === "recovery") return NextResponse.redirect(new URL("/reset-password", url.origin));
      if (data.user.email_confirmed_at) await notifyNewAccount(data.user.id);
      const { data: p } = await sb.from("profiles").select("role").eq("id", data.user.id).maybeSingle();
      return NextResponse.redirect(new URL(p?.role === "job_seeker" ? "/portal/profile" : "/portal", url.origin));
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
