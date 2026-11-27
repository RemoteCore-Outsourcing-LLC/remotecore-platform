import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PROFILE_SECTIONS, profileProgress } from "@/lib/portal/seeker";

// Job seekers who created an account but have not submitted their application yet (Kemar's doc, 2026-11-26).
// Reminder 1 goes 24 hours after sign up, reminder 2 at 3 days, reminder 3 (the last) at 7 days.
// For older accounts the gaps still hold: at least 2 days before reminder 2 and 4 days before reminder 3.
const DAY = 864e5;
export const REMINDER_PLAN = [
  { afterSignup: 1 * DAY, afterLast: 0 },
  { afterSignup: 3 * DAY, afterLast: 2 * DAY },
  { afterSignup: 7 * DAY, afterLast: 4 * DAY },
];

export type Incomplete = {
  id: string; name: string; email: string; country: string | null; phone: string | null;
  createdAt: string; confirmed: boolean; reminders: number; lastReminderAt: string | null; off: boolean;
};

// Every job seeker without a submitted application, newest first. Reads login confirmation from Supabase Auth.
export async function incompleteSignups(): Promise<Incomplete[]> {
  const db = supabaseAdmin();
  const rows: Record<string, unknown>[] = [];
  for (let from = 0; from < 50_000; from += 1000) {
    const { data } = await db.from("seeker_profiles")
      .select("user_id, signup_reminders, last_signup_reminder_at, signup_reminders_off, profiles!inner(full_name, email, phone, country, status, role, created_at)")
      .is("submitted_at", null).order("user_id").range(from, from + 999);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  const confirmed = new Set<string>();
  for (let page = 1; page < 100; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) break;
    data.users.forEach((u) => { if (u.email_confirmed_at) confirmed.add(u.id); });
    if (data.users.length < 1000) break;
  }
  return rows
    .map((r) => {
      const p = r.profiles as { full_name: string; email: string; phone: string | null; country: string | null; status: string; role: string; created_at: string };
      return { r, p };
    })
    .filter(({ p }) => p.role === "job_seeker" && p.status === "active")
    .map(({ r, p }) => ({
      id: r.user_id as string, name: p.full_name ?? "", email: p.email ?? "", country: p.country, phone: p.phone,
      createdAt: p.created_at, confirmed: confirmed.has(r.user_id as string), reminders: (r.signup_reminders as number) ?? 0,
      lastReminderAt: (r.last_signup_reminder_at as string) ?? null, off: !!r.signup_reminders_off,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Is the next reminder due for this person now?
export function reminderDue(s: Incomplete, now = Date.now()) {
  if (s.off || !s.confirmed || !s.email || s.reminders >= REMINDER_PLAN.length) return false;
  const step = REMINDER_PLAN[s.reminders];
  if (now < new Date(s.createdAt).getTime() + step.afterSignup) return false;
  if (s.lastReminderAt && now < new Date(s.lastReminderAt).getTime() + step.afterLast) return false;
  return true;
}

// What is still missing, in the words the profile page uses.
export async function missingParts(s: Incomplete) {
  const { done, complete } = await profileProgress(supabaseAdmin(), s.id, { full_name: s.name, phone: s.phone, country: s.country });
  if (complete) return ["press Submit application at the bottom of your profile"];
  // The photo is optional, so the email names only what is required.
  const words: Record<string, string> = { media: "resume and voice introduction", work_prefs: "pay and availability", about: "your name, phone and country" };
  return PROFILE_SECTIONS.filter(([k]) => !done[k]).map(([k, label]) => words[k] ?? label.toLowerCase());
}
