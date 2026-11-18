import "server-only";
import { getSession } from "@/lib/supabase/server";
import type { Company } from "@/components/portal/Employer";
import type { JobValues } from "@/components/portal/JobForm";

// The signed in employer and their company, for employer only pages.
export async function getEmployer() {
  const s = await getSession();
  if (!s.user || s.profile?.role !== "employer") return { ...s, company: null as Company | null };
  const { data } = await s.sb.from("companies").select("*").eq("owner_id", s.user.id).maybeSingle();
  return { ...s, company: data as Company | null };
}

export const JOB_EDIT_COLUMNS = "id, status, title, category_id, description, skills, qualifications, experience_level, salary_min, salary_max, salary_currency, salary_period, employment_type, remote_type, location_restrictions, computer_requirements, hours_time_zone, deadline, documents_required, review_note, published_at, created_at, updated_at";

// A saved job, as the values the job form starts with.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function toJobValues(j: any): JobValues {
  const s = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  return {
    title: j.title, category_id: s(j.category_id), description: j.description, skills: j.skills ?? [], qualifications: s(j.qualifications),
    experience_level: s(j.experience_level), salary_min: s(j.salary_min), salary_max: s(j.salary_max), salary_currency: j.salary_currency || "USD",
    salary_period: j.salary_period || "month", employment_type: s(j.employment_type), remote_type: j.remote_type, location_restrictions: s(j.location_restrictions),
    computer_requirements: s(j.computer_requirements), hours_time_zone: s(j.hours_time_zone), deadline: s(j.deadline), documents_required: s(j.documents_required),
  };
}
