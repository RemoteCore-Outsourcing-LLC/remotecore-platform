import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { JOB_EDIT_COLUMNS, toJobValues } from "@/lib/portal/employer";
import { JOB_STATUS } from "@/lib/employer";
import { PageHead } from "@/components/portal/Dash";
import { JobForm } from "@/components/portal/JobForm";
import { ReviewBox, AdminJobActions } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Job", robots: { index: false } };

export default async function AdminJob({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, admin } = await getAdmin();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: j }, { data: cats }, { count }] = await Promise.all([
    sb.from("jobs").select(`${JOB_EDIT_COLUMNS}, company_id, companies(name, owner_id)`).eq("id", id).maybeSingle(),
    sb.from("job_categories").select("id, name").order("sort"),
    sb.from("applications").select("id", { count: "exact", head: true }).eq("job_id", id),
  ]);
  if (!j) notFound();
  const co = j.companies as unknown as { name: string; owner_id: string } | null;
  const st = JOB_STATUS[j.status];
  const applicants = count ?? 0;

  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href={`/portal/admin/jobs?status=${j.status}`}>All jobs</a></p>
      <PageHead title={j.title} sub={co ? `Posted by ${co.name}` : "Posted by RemoteCore"} aside={<span className={`pill pill--${st?.tone ?? "neutral"}`}>{st?.label ?? j.status}</span>} />
      {j.status === "pending" && (
        <section className="panel cside areview" aria-labelledby="rev-h" style={{ marginBottom: 20 }}>
          <header className="panel__head"><h2 id="rev-h">Review this job</h2></header>
          <div className="cside__body">
            <p className="soft small">{j.published_at ? "The employer changed a job that was already live. It is hidden until you approve the new version." : "A new job from the employer. Check the details below, then approve it or ask for changes."}</p>
            <ReviewBox jobId={j.id} />
          </div>
        </section>
      )}
      {j.review_note && j.status === "draft" && <p className="notice notice--warn" role="status"><b>Sent back to the employer:</b> {j.review_note}</p>}
      <section className="panel cside" aria-labelledby="act-h" style={{ marginBottom: 20 }}>
        <header className="panel__head"><h2 id="act-h">Status</h2><a href={`/portal/admin/applications?job=${j.id}`}>{applicants} {applicants === 1 ? "applicant" : "applicants"}</a></header>
        <div className="cside__body">
          <p className="soft small">{st?.help}{co && <> Company: <a href={`/portal/admin/users/${co.owner_id}`}>{co.name}</a>.</>}</p>
          <AdminJobActions id={j.id} status={j.status} applicants={applicants} />
        </div>
      </section>
      <JobForm id={j.id} status={j.status} initial={toJobValues(j)} categories={cats ?? []} admin={{ companies: [] }} />
    </div>
  );
}
