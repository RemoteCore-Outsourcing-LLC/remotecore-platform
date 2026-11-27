import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "@/lib/email/send";
import { interviewInvite, interviewBooked, interviewBookedAdmin } from "@/lib/email/templates";

// Interview booking (call 2026-11-23): the team sets open hours once, a shortlisted candidate picks a time,
// both get a calendar file, and the candidate gets a reminder the day before.

export type InterviewSettings = {
  active: boolean; meeting_link: string | null; time_zone: string; days: number[];
  start_time: string; end_time: string; slot_minutes: number; notice_hours: number; days_ahead: number;
  blocked_dates: string[]; auto_invite: boolean;
};

export async function getInterviewSettings(): Promise<InterviewSettings> {
  const { data } = await supabaseAdmin().from("interview_settings").select("*").eq("id", 1).maybeSingle();
  return (data ?? { active: false, meeting_link: null, time_zone: "America/Chicago", days: [1, 2, 3, 4, 5], start_time: "09:00", end_time: "17:00", slot_minutes: 30, notice_hours: 12, days_ahead: 14, blocked_dates: [], auto_invite: true }) as InterviewSettings;
}

// Minutes the time zone is ahead of UTC at a given moment.
function offsetMinutes(tz: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return (Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute")) - Math.floor(at.getTime() / 60000) * 60000) / 60000;
}

// A wall clock time in the team's time zone, as a real moment.
function zoned(tz: string, y: number, m: number, d: number, hh: number, mm: number) {
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let t = guess - offsetMinutes(tz, new Date(guess)) * 60000;
  t = guess - offsetMinutes(tz, new Date(t)) * 60000;
  return new Date(t);
}

// Every free start time from now until days_ahead, minus booked ones.
export async function freeSlots(s?: InterviewSettings): Promise<string[]> {
  const set = s ?? (await getInterviewSettings());
  if (!set.active) return [];
  // Interviews and consultation calls share the same open hours, so a time taken by either one is gone.
  const now = new Date().toISOString();
  const db = supabaseAdmin();
  const [{ data: taken }, { data: calls }] = await Promise.all([
    db.from("interviews").select("starts_at").eq("status", "booked").gte("starts_at", now),
    db.from("consultation_bookings").select("starts_at").eq("status", "booked").gte("starts_at", now),
  ]);
  const busy = new Set([...(taken ?? []), ...(calls ?? [])].map((r) => new Date(r.starts_at as string).toISOString()));
  const earliest = Date.now() + set.notice_hours * 3600_000;
  const [sh, sm] = set.start_time.split(":").map(Number);
  const [eh, em] = set.end_time.split(":").map(Number);
  const out: string[] = [];
  const blocked = new Set(set.blocked_dates);
  for (let i = 0; i <= set.days_ahead; i++) {
    const day = new Date(Date.now() + i * 864e5);
    const local = new Intl.DateTimeFormat("en-CA", { timeZone: set.time_zone, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" }).formatToParts(day);
    const g = (t: string) => local.find((p) => p.type === t)?.value ?? "";
    const y = Number(g("year")), m = Number(g("month")), d = Number(g("day"));
    const iso = `${g("year")}-${g("month")}-${g("day")}`;
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (!set.days.includes(wd) || blocked.has(iso)) continue;
    for (let min = sh * 60 + sm; min + set.slot_minutes <= eh * 60 + em; min += set.slot_minutes) {
      const at = zoned(set.time_zone, y, m, d, Math.floor(min / 60), min % 60);
      if (at.getTime() < earliest) continue;
      const k = at.toISOString();
      if (!busy.has(k) && !out.includes(k)) out.push(k);
    }
  }
  return out;
}

export const validTz = (tz: string | null | undefined) => {
  if (!tz) return null;
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return tz; } catch { return null; }
};

export const whenText = (iso: string, tz: string) =>
  new Date(iso).toLocaleString("en-US", { timeZone: tz, weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });

// A calendar file (.ics) so the interview lands in any calendar app.
export function icsFile(a: { id: string; start: string; end: string; title: string; link: string | null; description: string; alarm?: string }) {
  const f = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const clean = (t: string) => t.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//RemoteCore Outsourcing//Interviews//EN", "METHOD:PUBLISH", "BEGIN:VEVENT",
    `UID:${a.id}@remotecoreoutsourcing.com`, `DTSTAMP:${f(new Date().toISOString())}`, `DTSTART:${f(a.start)}`, `DTEND:${f(a.end)}`,
    `SUMMARY:${clean(a.title)}`, `DESCRIPTION:${clean(a.description)}`, ...(a.link ? [`LOCATION:${clean(a.link)}`, `URL:${a.link}`] : []),
    "BEGIN:VALARM", "TRIGGER:-PT30M", "ACTION:DISPLAY", `DESCRIPTION:${clean(a.alarm ?? "Interview in 30 minutes")}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ];
  return Buffer.from(lines.join("\r\n")).toString("base64");
}

// Opens an interview invite for a candidate and emails them the booking link.
// Does nothing if the candidate already has an open invite or a booked interview, or booking is off.
export async function inviteToInterview(seekerId: string, opts: { applicationId?: string | null; by?: string | null; force?: boolean } = {}) {
  const set = await getInterviewSettings();
  if (!set.active || (!set.auto_invite && !opts.force)) return { ok: false as const, reason: "off" };
  const db = supabaseAdmin();
  const { data: open } = await db.from("interviews").select("id").eq("seeker_id", seekerId).in("status", ["invited", "booked"]).maybeSingle();
  if (open) return { ok: false as const, reason: "open" };
  const { data: row, error } = await db.from("interviews")
    .insert({ seeker_id: seekerId, application_id: opts.applicationId ?? null, invited_by: opts.by ?? null, meeting_link: set.meeting_link })
    .select("id").single();
  if (error || !row) return { ok: false as const, reason: "error" };
  const [{ data: p }, app] = await Promise.all([
    db.from("profiles").select("full_name, email").eq("id", seekerId).maybeSingle(),
    opts.applicationId ? db.from("applications").select("jobs(title)").eq("id", opts.applicationId).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const job = (app.data as { jobs: { title: string } | null } | null)?.jobs?.title ?? null;
  if (p?.email) await sendEmail({ to: p.email, ...interviewInvite({ name: p.full_name, job }) });
  return { ok: true as const, id: row.id };
}

// Emails after a booking: the candidate (with the calendar file) and the team (with the same file).
export async function notifyInterviewBooked(interviewId: string) {
  const db = supabaseAdmin();
  const { data: iv } = await db.from("interviews").select("id, seeker_id, starts_at, ends_at, meeting_link, applications(jobs(title)), profiles!interviews_seeker_id_fkey(full_name, email)").eq("id", interviewId).maybeSingle();
  if (!iv?.starts_at) return;
  const [set, { data: sp }] = await Promise.all([getInterviewSettings(), db.from("seeker_profiles").select("time_zone").eq("user_id", iv.seeker_id).maybeSingle()]);
  const theirTz = validTz(sp?.time_zone) ?? set.time_zone;
  const who = iv.profiles as unknown as { full_name: string; email: string } | null;
  const job = (iv.applications as unknown as { jobs: { title: string } | null } | null)?.jobs?.title ?? null;
  const ics = icsFile({ id: iv.id, start: iv.starts_at, end: iv.ends_at ?? iv.starts_at, title: `RemoteCore interview${who?.full_name ? `: ${who.full_name}` : ""}`, link: iv.meeting_link, description: `Interview with RemoteCore Outsourcing.${iv.meeting_link ? ` Join: ${iv.meeting_link}` : ""}` });
  const attach = [{ filename: "interview.ics", content: ics }];
  const team = adminEmails();
  await Promise.allSettled([
    who?.email ? sendEmail({ to: who.email, ...interviewBooked({ name: who.full_name, when: whenText(iv.starts_at, theirTz), link: iv.meeting_link }), attachments: attach }) : null,
    team.length ? sendEmail({ to: team, ...interviewBookedAdmin({ name: who?.full_name ?? "", email: who?.email ?? "", when: whenText(iv.starts_at, set.time_zone), job, id: iv.seeker_id }), attachments: attach }) : null,
  ]);
}
