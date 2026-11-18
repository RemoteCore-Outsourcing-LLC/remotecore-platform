import "server-only";
import { getSession } from "@/lib/supabase/server";
import type { Company } from "@/components/portal/Employer";

// The signed in employer and their company, for employer only pages.
export async function getEmployer() {
  const s = await getSession();
  if (!s.user || s.profile?.role !== "employer") return { ...s, company: null as Company | null };
  const { data } = await s.sb.from("companies").select("*").eq("owner_id", s.user.id).maybeSingle();
  return { ...s, company: data as Company | null };
}

export const JOB_EDIT_COLUMNS = "id, status, title, category_id, description, skills, qualifications, experience_level, salary_min, salary_max, salary_currency, salary_period, employment_type, remote_type, location_restrictions, computer_requirements, hours_time_zone, deadline, documents_required, published_at, created_at, updated_at";
