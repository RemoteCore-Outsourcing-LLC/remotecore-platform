import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { APP_STATUS } from "@/lib/portal/seeker";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Employer side of applications: every applicant to the company's own jobs, read as the employer.
// Row level security decides what comes back; the company filter only keeps the query tidy.

export const STATUS_ORDER = Object.keys(APP_STATUS);
// Still waiting on a decision.
export const OPEN_STATUSES = ["application_received", "under_review", "shortlisted", "interview_stage"];

export type Applicant = {
  id: string; status: string; created_at: string; updated_at: string;
  job: { id: string; title: string; status: string };
  seeker_id: string; name: string; country: string | null;
  headline: string | null; years: number | null; skills: string[];
};

export async function companyApplicants(sb: SupabaseClient, companyId: string): Promise<Applicant[]> {
  const { data } = await sb.from("applications")
    .select("id, status, created_at, updated_at, seeker_id, jobs!inner(id, title, status, company_id), profiles!applications_seeker_id_fkey(full_name, country)")
    .eq("jobs.company_id", companyId).order("updated_at", { ascending: false });
  const rows = data ?? [];
  const ids = Array.from(new Set(rows.map((r) => r.seeker_id)));
  const [sp, sk] = ids.length
    ? await Promise.all([
        sb.from("seeker_profiles").select("user_id, headline, years_experience").in("user_id", ids),
        sb.from("seeker_skills").select("user_id, skill").in("user_id", ids),
      ])
    : [{ data: [] }, { data: [] }];
  const byId = new Map((sp.data ?? []).map((x) => [x.user_id as string, x]));
  const skills = new Map<string, string[]>();
  for (const s of sk.data ?? []) skills.set(s.user_id as string, [...(skills.get(s.user_id as string) ?? []), s.skill as string]);
  return rows.map((r) => {
    const job = r.jobs as unknown as { id: string; title: string; status: string };
    const who = r.profiles as unknown as { full_name: string; country: string | null } | null;
    const p = byId.get(r.seeker_id);
    return {
      id: r.id, status: r.status, created_at: r.created_at, updated_at: r.updated_at, job,
      seeker_id: r.seeker_id, name: who?.full_name || "Candidate", country: who?.country ?? null,
      headline: (p?.headline as string | null) ?? null, years: (p?.years_experience as number | null) ?? null,
      skills: skills.get(r.seeker_id) ?? [],
    };
  });
}

export function countByStatus(apps: { status: string }[]) {
  const c: Record<string, number> = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0]));
  for (const a of apps) c[a.status] = (c[a.status] ?? 0) + 1;
  return c;
}

export const EMPLOYMENT: Record<string, string> = { full_time: "Full time", part_time: "Part time", contract: "Contract", freelance: "Freelance" };

export type CandidateDetail = Awaited<ReturnType<typeof candidateDetail>>;

// One applicant, read as the employer. Returns null unless the application is on this company's job.
// Contact details (email, phone) are left out on purpose: employers talk to candidates through RemoteCore.
export async function candidateDetail(sb: SupabaseClient, companyId: string, appId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(appId)) return null;
  const { data: a } = await sb.from("applications")
    .select("id, status, note, resume_path, extra_documents, created_at, updated_at, seeker_id, jobs!inner(id, title, status, company_id, computer_requirements, documents_required), application_status_history(to_status, changed_at)")
    .eq("id", appId).eq("jobs.company_id", companyId).maybeSingle();
  if (!a) return null;
  const uid = a.seeker_id as string;
  const { who, sp, pc, work, edu, certs, skills, langs } = await loadSeeker(sb, uid);
  const { data: canSee } = sp.data?.photo_path ? await sb.rpc("employer_can_see", { seeker: uid }) : { data: false };
  const photo = canSee === true ? await photoLink(uid, sp.data?.photo_path) : null;
  const hist = ((a.application_status_history ?? []) as { to_status: string; changed_at: string }[])
    .slice().sort((x, y) => y.changed_at.localeCompare(x.changed_at));
  return {
    id: a.id as string, status: a.status as string, note: a.note as string | null, created_at: a.created_at as string,
    hasResume: !!(a.resume_path || sp.data?.resume_path), documents: ((a.extra_documents ?? []) as string[]).map(fileLabel),
    hasAudio: !!sp.data?.audio_path, photo,
    job: a.jobs as unknown as { id: string; title: string; status: string; computer_requirements: string | null; documents_required: string | null },
    name: who.data?.full_name || "Candidate", country: who.data?.country ?? null,
    profile: sp.data, computer: pc.data, work: work.data ?? [], education: edu.data ?? [], certs: certs.data ?? [],
    skills: (skills.data ?? []).map((s) => s.skill as string), languages: langs.data ?? [], hist,
  };
}

// A 10 minute signed link to a job seeker's photo. Callers check who may see it first.
export async function photoLink(uid: string, path: unknown) {
  if (!path || typeof path !== "string" || !path.startsWith(`${uid}/`) || path.includes("..")) return null;
  const { data } = await supabaseAdmin().storage.from("photos").createSignedUrl(path, 600);
  return data?.signedUrl ?? null;
}

// The file name a person sees, from a storage path like "<user>/<time>-cv.pdf".
export function fileLabel(path: string) {
  const base = path.split("/").pop() ?? path;
  return base.replace(/^doc-\d{10,}-/, "");
}

// Every part of a job seeker's profile. Row level security decides what the reader gets back.
export async function loadSeeker(sb: SupabaseClient, uid: string) {
  const [who, sp, pc, work, edu, certs, skills, langs] = await Promise.all([
    sb.from("profiles").select("full_name, country").eq("id", uid).maybeSingle(),
    sb.from("seeker_profiles").select("headline, summary, years_experience, employment_types, preferred_hours, time_zone, available_from, qualifications, expected_salary, salary_currency, audio_path, resume_path, photo_path").eq("user_id", uid).maybeSingle(),
    sb.from("computer_specs").select("computer_type, operating_system, processor, ram, storage, connection_type, download_mbps, upload_mbps, has_webcam, has_microphone, other_equipment").eq("user_id", uid).maybeSingle(),
    sb.from("work_history").select("company, title, start_date, end_date, description").eq("user_id", uid).order("start_date", { ascending: false, nullsFirst: false }),
    sb.from("education").select("school, degree, field, start_year, end_year").eq("user_id", uid).order("end_year", { ascending: false, nullsFirst: false }),
    sb.from("certifications").select("name, issuer, year").eq("user_id", uid).order("year", { ascending: false, nullsFirst: false }),
    sb.from("seeker_skills").select("skill").eq("user_id", uid),
    sb.from("seeker_languages").select("language, level").eq("user_id", uid),
  ]);
  return { who, sp, pc, work, edu, certs, skills, langs };
}
