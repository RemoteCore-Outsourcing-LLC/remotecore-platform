import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { JOB_STATUS } from "@/lib/employer";
import { ago, shortDate } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";

export const metadata: Metadata = { title: "Jobs", robots: { index: false } };

type Row = { id: string; title: string; status: string; deadline: string | null; updated_at: string; company_id: string | null; companies: { name: string } | null; applications: { count: number }[] };
const TABS = ["pending", "published", "paused", "draft", "closed"];

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ status?: string; q?: string; saved?: string; removed?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const { data } = await sb.from("jobs").select("id, title, status, deadline, updated_at, company_id, companies(name), applications(count)").order("updated_at", { ascending: false }).limit(1000);
  const all = (data ?? []) as unknown as Row[];
  const counts = Object.fromEntries(TABS.map((t) => [t, all.filter((j) => j.status === t).length]));
  const status = TABS.includes(sp.status ?? "") ? sp.status! : counts.pending > 0 ? "pending" : "published";
  const q = (sp.q ?? "").trim().toLowerCase();
  const shown = all.filter((j) => j.status === status && (!q || `${j.title} ${j.companies?.name ?? "remotecore"}`.toLowerCase().includes(q)));

  return (
    <div className="pwrap">
      <PageHead title="Jobs" sub="Review employer jobs, post RemoteCore jobs, and pause or close any job." aside={<span className="aact__row"><a className="btn btn--ghost btn--sm" href="/portal/admin/categories">Categories</a><a className="btn btn--main btn--sm" href="/portal/admin/jobs/new">Post a job</a></span>} />
      {sp.saved && <p className="notice" role="status">{sp.saved === "live" ? "Saved. The job is live." : "Saved."}</p>}
      {sp.removed && <p className="notice" role="status">The job was removed.</p>}
      <nav className="seg seg--tabs" aria-label="Job status">
        {TABS.map((t) => <a key={t} href={`/portal/admin/jobs?status=${t}`} aria-current={status === t ? "page" : undefined}>{JOB_STATUS[t].label} <b>{counts[t]}</b></a>)}
      </nav>
      <form className="cfilter" action="/portal/admin/jobs" role="search">
        <input type="hidden" name="status" value={status} />
        <div className="cfilter__job"><label className="field"><span>Search</span><input name="q" defaultValue={sp.q} placeholder="Job title or company" /></label><button className="btn btn--ghost btn--sm">Search</button></div>
      </form>
      <section className="panel" aria-label="Jobs">
        {shown.length === 0 ? (
          <Empty title={status === "pending" ? "Nothing to review" : "No jobs here"}>{status === "pending" ? "Jobs that employers send for review show up here." : "Try another tab or search."}</Empty>
        ) : (
          <ul className="rows crows">
            {shown.map((j) => {
              const apps = j.applications?.[0]?.count ?? 0;
              return (
                <li key={j.id}>
                  <div className="crows__who">
                    <a className="rows__title" href={`/portal/admin/jobs/${j.id}`}>{j.title}</a>
                    <span className="soft small">{j.companies?.name ?? "RemoteCore"} · Updated {ago(j.updated_at)}{j.deadline ? ` · Apply by ${shortDate(j.deadline)}` : ""}</span>
                  </div>
                  <a className="jrows__apps" href={`/portal/admin/applications?job=${j.id}`}><b>{apps}</b> {apps === 1 ? "applicant" : "applicants"}</a>
                  <a className="btn btn--ghost btn--sm" href={`/portal/admin/jobs/${j.id}`}>{j.status === "pending" ? "Review" : "Open"}</a>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
