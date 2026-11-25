import type { SupabaseClient } from "@supabase/supabase-js";

// Shared by the dashboard pages: profile progress, labels and job formatting.

export const PROFILE_SECTIONS = [
  ["about", "About you"], ["media", "Photo, resume and voice"], ["work_prefs", "Pay and availability"],
  ["work", "Work history"], ["education", "Education"], ["certs", "Qualifications"], ["skills", "Skills and languages"],
] as const;

export type SectionDone = Record<(typeof PROFILE_SECTIONS)[number][0], boolean>;

// Same rules as the profile editor, worked out on the server.
export async function profileProgress(sb: SupabaseClient, uid: string, profile: { full_name?: string; phone?: string | null; country?: string | null }) {
  const head = { count: "exact" as const, head: true };
  const [sp, work, edu, certs, skills, langs] = await Promise.all([
    sb.from("seeker_profiles").select("expected_salary, employment_types, time_zone, qualifications, resume_path, audio_path").eq("user_id", uid).maybeSingle(),
    sb.from("work_history").select("user_id", head).eq("user_id", uid),
    sb.from("education").select("user_id", head).eq("user_id", uid),
    sb.from("certifications").select("user_id", head).eq("user_id", uid),
    sb.from("seeker_skills").select("user_id", head).eq("user_id", uid),
    sb.from("seeker_languages").select("user_id", head).eq("user_id", uid),
  ]);
  const p = sp.data ?? {} as Record<string, unknown>;
  const done: SectionDone = {
    about: !!(profile.full_name && profile.phone && profile.country),
    media: !!(p.resume_path && p.audio_path),
    work_prefs: !!(p.expected_salary && Array.isArray(p.employment_types) && p.employment_types.length && p.time_zone),
    work: (work.count ?? 0) > 0,
    education: (edu.count ?? 0) > 0,
    certs: !!p.qualifications || (certs.count ?? 0) > 0,
    skills: (skills.count ?? 0) > 0 && (langs.count ?? 0) > 0,
  };
  const count = Object.values(done).filter(Boolean).length;
  return { done, count, total: PROFILE_SECTIONS.length, complete: count === PROFILE_SECTIONS.length };
}

export const APP_STATUS: Record<string, { label: string; tone: "info" | "good" | "bad" | "neutral"; step: number }> = {
  application_received: { label: "Application received", tone: "neutral", step: 0 },
  under_review: { label: "Under review", tone: "info", step: 1 },
  shortlisted: { label: "Shortlisted", tone: "info", step: 2 },
  interview_stage: { label: "Interview stage", tone: "info", step: 3 },
  selected: { label: "Selected", tone: "good", step: 4 },
  not_selected: { label: "Not selected", tone: "bad", step: 4 },
  position_filled: { label: "Position filled", tone: "bad", step: 4 },
};
export const APP_STEPS = ["Received", "Under review", "Shortlisted", "Interview", "Decision"];

const TYPE: Record<string, string> = { full_time: "Full time", part_time: "Part time", contract: "Contract", freelance: "Freelance" };
const LEVEL: Record<string, string> = { entry: "Entry level", mid: "Mid level", senior: "Senior" };

export type JobRow = {
  id: string; title: string; description: string; skills: string[]; employment_type: string | null; experience_level: string | null;
  remote_type: string; location_restrictions: string | null; salary_min: number | null; salary_max: number | null;
  salary_currency: string | null; salary_period: string | null; hours_time_zone: string | null; deadline: string | null;
  published_at: string | null; created_at: string; qualifications?: string | null; computer_requirements?: string | null;
  job_categories?: { name: string } | null;
};
export const JOB_COLUMNS = "id, title, description, skills, employment_type, experience_level, remote_type, location_restrictions, salary_min, salary_max, salary_currency, salary_period, hours_time_zone, deadline, published_at, created_at, job_categories(name)";

export function money(n: number, cur = "USD") {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
  catch { return `${cur} ${Math.round(n).toLocaleString("en-US")}`; }
}
export function pay(j: Pick<JobRow, "salary_min" | "salary_max" | "salary_currency" | "salary_period">) {
  const cur = j.salary_currency || "USD";
  const per = j.salary_period ? ` ${j.salary_period === "hour" ? "an" : "a"} ${j.salary_period}` : "";
  if (j.salary_min && j.salary_max) return `${money(j.salary_min, cur)} to ${money(j.salary_max, cur)}${per}`;
  if (j.salary_min) return `From ${money(j.salary_min, cur)}${per}`;
  if (j.salary_max) return `Up to ${money(j.salary_max, cur)}${per}`;
  return null;
}
export function jobFacts(j: JobRow) {
  return [
    j.remote_type === "location_restricted" ? `Remote, ${j.location_restrictions || "some locations only"}` : "Fully remote",
    j.employment_type ? TYPE[j.employment_type] ?? j.employment_type : null,
    j.experience_level ? LEVEL[j.experience_level] ?? j.experience_level : null,
  ].filter(Boolean) as string[];
}

export function shortDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
export function ago(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (d <= 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 30) return `${d} days ago`;
  return shortDate(iso);
}

// The RemoteCore team's own stage for a candidate (set on the admin candidate page).
export const STAGE_LABEL: Record<string, string> = { new: "New", shortlisted: "Shortlisted", interview: "Interviewed", approved: "Approved", not_a_fit: "Not a fit" };
