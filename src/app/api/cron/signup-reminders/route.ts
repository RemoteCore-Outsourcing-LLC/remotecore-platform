import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { signupReminder } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/links";
import { incompleteSignups, missingParts, reminderDue } from "@/lib/signup-reminders";

export const maxDuration = 60;

// Runs every hour (vercel.json). Emails job seekers who signed up but did not finish their application:
// 24 hours, 3 days and 7 days after sign up, then stops. Stops at once when they submit or unsubscribe.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const due = (await incompleteSignups()).filter((s) => reminderDue(s)).slice(0, 80);
  let sent = 0;
  for (const s of due) {
    const step = s.reminders + 1;
    // Count it first, so a slow or repeated run can never send the same reminder twice.
    const { data: claimed } = await db.from("seeker_profiles")
      .update({ signup_reminders: step, last_signup_reminder_at: new Date().toISOString() })
      .eq("user_id", s.id).eq("signup_reminders", s.reminders).is("submitted_at", null).select("user_id").maybeSingle();
    if (!claimed) continue;
    const unsub = unsubscribeUrl(s.id, "reminders");
    const r = await sendEmail({
      to: s.email,
      ...signupReminder({ name: s.name, missing: await missingParts(s), step, unsubscribe: unsub }),
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (r.ok) sent++;
    else await db.from("seeker_profiles").update({ signup_reminders: s.reminders, last_signup_reminder_at: s.lastReminderAt }).eq("user_id", s.id);
  }
  return NextResponse.json({ due: due.length, sent });
}
