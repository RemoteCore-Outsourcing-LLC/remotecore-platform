import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { interviewBooked } from "@/lib/email/templates";
import { validTz, whenText } from "@/lib/interviews";

export const maxDuration = 60;

// Runs every hour (vercel.json). Reminds each candidate about 24 hours before a booked interview.
// Interviews booked less than a day ahead got their confirmation recently, so they get no reminder.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const now = Date.now();
  const { data } = await db.from("interviews")
    .select("id, seeker_id, starts_at, booked_at, meeting_link, profiles!interviews_seeker_id_fkey(full_name, email)")
    .eq("status", "booked").is("reminded_at", null)
    .gt("starts_at", new Date(now).toISOString()).lte("starts_at", new Date(now + 25 * 3600_000).toISOString());
  let sent = 0;
  for (const iv of data ?? []) {
    const start = new Date(iv.starts_at as string).getTime();
    if (iv.booked_at && start - new Date(iv.booked_at).getTime() < 24 * 3600_000) {
      await db.from("interviews").update({ reminded_at: new Date().toISOString() }).eq("id", iv.id);
      continue;
    }
    const who = iv.profiles as unknown as { full_name: string; email: string } | null;
    if (!who?.email) continue;
    const { data: sp } = await db.from("seeker_profiles").select("time_zone").eq("user_id", iv.seeker_id).maybeSingle();
    const r = await sendEmail({ to: who.email, ...interviewBooked({ name: who.full_name, when: whenText(iv.starts_at as string, validTz(sp?.time_zone) ?? "America/Chicago"), link: iv.meeting_link, reminder: true }) });
    if (r.ok) { sent++; await db.from("interviews").update({ reminded_at: new Date().toISOString() }).eq("id", iv.id); }
  }
  return NextResponse.json({ sent });
}
