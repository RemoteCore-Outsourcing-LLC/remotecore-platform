import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { jobAlert } from "@/lib/email/templates";
import { unsubscribeUrl } from "@/lib/email/links";
import { SITE } from "@/lib/email/layout";
import { JOB_COLUMNS, jobFacts, pay, type JobRow } from "@/lib/portal/seeker";

export const maxDuration = 60;

// Runs every Monday (vercel.json). Each job seeker with alerts on gets the open jobs posted since their last alert
// in the categories they chose, minus jobs they already applied to. Nobody gets an empty email.
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const { data: jobs } = await db.from("jobs").select(JOB_COLUMNS).eq("status", "published").gte("published_at", weekAgo).order("published_at", { ascending: false }).limit(500);
  const open = ((jobs ?? []) as unknown as (JobRow & { published_at: string })[]).filter((j) => !j.deadline || j.deadline >= today);
  if (!open.length) return NextResponse.json({ sent: 0, jobs: 0 });

  const { data: seekers } = await db.from("seeker_profiles")
    .select("user_id, preferred_categories, last_job_alert_at, profiles!inner(full_name, email, status, role)")
    .eq("job_alerts", true).neq("preferred_categories", "{}");

  let sent = 0;
  for (const s of seekers ?? []) {
    const p = s.profiles as unknown as { full_name: string; email: string; status: string; role: string };
    if (p.role !== "job_seeker" || p.status !== "active" || !p.email) continue;
    const since = s.last_job_alert_at && s.last_job_alert_at > weekAgo ? s.last_job_alert_at : weekAgo;
    const cats = new Set((s.preferred_categories as string[]).map((c) => c.toLowerCase()));
    let match = open.filter((j) => j.published_at > since && cats.has((j.job_categories?.name ?? "").toLowerCase()));
    if (!match.length) continue;
    const { data: applied } = await db.from("applications").select("job_id").eq("seeker_id", s.user_id).in("job_id", match.map((j) => j.id));
    const done = new Set((applied ?? []).map((a) => a.job_id));
    match = match.filter((j) => !done.has(j.id)).slice(0, 10);
    if (!match.length) continue;

    const unsub = unsubscribeUrl(s.user_id);
    const r = await sendEmail({
      to: p.email,
      ...jobAlert({ name: p.full_name, unsubscribe: unsub, jobs: match.map((j) => ({ title: j.title, category: j.job_categories?.name ?? "", facts: [...jobFacts(j), pay(j)].filter(Boolean).join(" · "), url: `${SITE}/portal/jobs/${j.id}` })) }),
      headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    if (r.ok) { sent++; await db.from("seeker_profiles").update({ last_job_alert_at: new Date().toISOString() }).eq("user_id", s.user_id); }
  }
  return NextResponse.json({ sent, jobs: open.length });
}
