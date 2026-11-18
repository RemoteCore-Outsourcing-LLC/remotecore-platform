import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployer, JOB_EDIT_COLUMNS, toJobValues } from "@/lib/portal/employer";
import { PageHead } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { JobForm } from "@/components/portal/JobForm";
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
  const initial = toJobValues(j);
  const st = JOB_STATUS[j.status];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="back"><a href="/portal/postings">All your jobs</a></p>
      <PageHead title={j.title} sub={st?.help} aside={<span className={`pill pill--${st?.tone ?? "neutral"}`}>{st?.label ?? j.status}</span>} />
      {j.review_note && j.status === "draft" && <p className="notice notice--warn" role="status"><b>RemoteCore asked for a change:</b> {j.review_note}</p>}
      <JobForm id={j.id} status={j.status} initial={initial} categories={cats ?? []} />
    </div>
  );
}
