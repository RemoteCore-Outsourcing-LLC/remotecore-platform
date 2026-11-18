import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead, Empty } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { JobStatusActions } from "@/components/portal/EmployerClient";
import { JOB_STATUS } from "@/lib/employer";
import { shortDate } from "@/lib/portal/seeker";

export const metadata: Metadata = { title: "Your jobs", robots: { index: false } };

type Row = { id: string; title: string; status: string; deadline: string | null; published_at: string | null; updated_at: string; applications: { count: number }[] };

export default async function Postings({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const { saved } = await searchParams;
  const { data } = await sb.from("jobs").select("id, title, status, deadline, published_at, updated_at, applications(count)").eq("company_id", company.id).order("updated_at", { ascending: false });
  const jobs = (data ?? []) as unknown as Row[];
  const order = ["pending", "published", "draft", "paused", "closed"];
  jobs.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <div className="pwrap">
      <PageHead title="Your jobs" sub="Post a role, follow its review and pause or close it when you are done." aside={<a className="btn btn--main btn--sm" href="/portal/postings/new">Post a job</a>} />
      {saved && <p className="notice" role="status">{saved === "draft" ? "Draft saved. Only you can see it." : "Sent for review. We will email you when it goes live."}</p>}
      {jobs.length === 0 ? (
        <Empty title="No jobs yet" action={<a className="btn btn--main btn--sm" href="/portal/postings/new">Post your first job</a>}>Post a role and RemoteCore reviews it before job seekers can see it. Rather not post publicly? <a href="/portal/requests/new">Send a staffing request</a> instead.</Empty>
      ) : (
        <section className="panel" aria-label="Your jobs">
          <ul className="rows jrows">
            {jobs.map((j) => {
              const s = JOB_STATUS[j.status] ?? { label: j.status, tone: "neutral", help: "" };
              const apps = j.applications?.[0]?.count ?? 0;
              return (
                <li key={j.id}>
                  <div>
                    <a className="rows__title" href={`/portal/postings/${j.id}`}>{j.title}</a>
                    <span className="soft small"><span className={`pill pill--${s.tone}`}>{s.label}</span> {s.help} {j.deadline ? `Apply by ${shortDate(j.deadline)}.` : ""}</span>
                  </div>
                  <span className="jrows__apps"><b>{apps}</b> {apps === 1 ? "applicant" : "applicants"}</span>
                  <JobStatusActions id={j.id} status={j.status} approvedBefore={!!j.published_at} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
