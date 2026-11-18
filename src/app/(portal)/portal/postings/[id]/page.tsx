import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployer, JOB_EDIT_COLUMNS } from "@/lib/portal/employer";
import { PageHead } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { JobForm, type JobValues } from "@/components/portal/JobForm";
import { JOB_STATUS } from "@/lib/employer";

export const metadata: Metadata = { title: "Edit job", robots: { index: false } };

export default async function EditJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: j }, { data: cats }] = await Promise.all([
    sb.from("jobs").select(JOB_EDIT_COLUMNS).eq("id", id).eq("company_id", company.id).maybeSingle(),
    sb.from("job_categories").select("id, name").order("sort"),
  ]);
  if (!j) notFound();
  const s = (x: unknown) => (x === null || x === undefined ? "" : String(x));
  const initial: JobValues = {
    title: j.title, category_id: s(j.category_id), description: j.description, skills: j.skills ?? [], qualifications: s(j.qualifications),
    experience_level: s(j.experience_level), salary_min: s(j.salary_min), salary_max: s(j.salary_max), salary_currency: j.salary_currency || "USD",
    salary_period: j.salary_period || "month", employment_type: s(j.employment_type), remote_type: j.remote_type, location_restrictions: s(j.location_restrictions),
    computer_requirements: s(j.computer_requirements), hours_time_zone: s(j.hours_time_zone), deadline: s(j.deadline), documents_required: s(j.documents_required),
  };
  const st = JOB_STATUS[j.status];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="back"><a href="/portal/postings">All your jobs</a></p>
      <PageHead title={j.title} sub={st?.help} aside={<span className={`pill pill--${st?.tone ?? "neutral"}`}>{st?.label ?? j.status}</span>} />
      <JobForm id={j.id} status={j.status} initial={initial} categories={cats ?? []} />
    </div>
  );
}
