import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { APP_STATUS, ago } from "@/lib/portal/seeker";
import { STATUS_ORDER, OPEN_STATUSES } from "@/lib/portal/candidates";
import { PageHead, Empty } from "@/components/portal/Dash";
import { AdminAppStatus } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Applications", robots: { index: false } };

type Row = {
  id: string; status: string; created_at: string; updated_at: string; seeker_id: string;
  jobs: { id: string; title: string; company_id: string | null; companies: { name: string } | null } | null;
  profiles: { full_name: string; email: string; country: string | null } | null;
};

// Every application on every job, each linked to its job, its employer and the candidate.
export default async function AdminApplications({ searchParams }: { searchParams: Promise<{ job?: string; company?: string; status?: string; q?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const { data } = await sb.from("applications")
    .select("id, status, created_at, updated_at, seeker_id, jobs(id, title, company_id, companies(name)), profiles!applications_seeker_id_fkey(full_name, email, country)")
    .order("updated_at", { ascending: false }).limit(2000);
  const all = (data ?? []) as unknown as Row[];
  const jobs = Array.from(new Map(all.filter((a) => a.jobs).map((a) => [a.jobs!.id, a.jobs!])).values()).sort((a, b) => a.title.localeCompare(b.title));
  const companies = Array.from(new Map(all.map((a) => [a.jobs?.company_id ?? "remotecore", a.jobs?.companies?.name ?? "RemoteCore"])).entries()).sort((a, b) => a[1].localeCompare(b[1]));
  const q = (sp.q ?? "").trim().toLowerCase();
  const base = all.filter((a) =>
    (!sp.job || a.jobs?.id === sp.job) &&
    (!sp.company || (a.jobs?.company_id ?? "remotecore") === sp.company) &&
    (!q || `${a.profiles?.full_name} ${a.profiles?.email} ${a.jobs?.title}`.toLowerCase().includes(q)));
  const st = sp.status === "open" || STATUS_ORDER.includes(sp.status ?? "") ? sp.status! : "";
  const shown = st === "open" ? base.filter((a) => OPEN_STATUSES.includes(a.status)) : st ? base.filter((a) => a.status === st) : base;
  const link = (s: string) => {
    const p = new URLSearchParams();
    for (const k of ["job", "company", "q"] as const) if (sp[k]) p.set(k, sp[k]!);
    if (s) p.set("status", s);
    return `/portal/admin/applications${p.size ? `?${p}` : ""}`;
  };
  const count = (s: string) => base.filter((a) => a.status === s).length;

  return (
    <div className="pwrap">
      <PageHead title="Applications" sub="Every application, with its job and employer. Change a status here and the candidate gets an email." />
      <form className="cfilter" action="/portal/admin/applications" role="search">
        <div className="cfilter__job">
          <label className="field"><span>Search</span><input name="q" defaultValue={sp.q} placeholder="Candidate or job" /></label>
          <label className="field"><span>Job</span>
            <select name="job" defaultValue={sp.job ?? ""}><option value="">All jobs</option>{jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}</select>
          </label>
          <label className="field"><span>Employer</span>
            <select name="company" defaultValue={sp.company ?? ""}><option value="">All employers</option>{companies.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select>
          </label>
          {st && <input type="hidden" name="status" value={st} />}
          <button className="btn btn--ghost btn--sm">Show</button>
        </div>
      </form>
      <nav className="seg seg--tabs" aria-label="Filter by status">
        <a href={link("")} aria-current={!st ? "page" : undefined}>All <b>{base.length}</b></a>
        <a href={link("open")} aria-current={st === "open" ? "page" : undefined}>Open <b>{base.filter((a) => OPEN_STATUSES.includes(a.status)).length}</b></a>
        {STATUS_ORDER.filter((s) => count(s) > 0 || s === st).map((s) => <a key={s} href={link(s)} aria-current={st === s ? "page" : undefined}>{APP_STATUS[s].label} <b>{count(s)}</b></a>)}
      </nav>
      <section className="panel" aria-label="Applications">
        {shown.length === 0 ? <Empty title="No applications here">{all.length ? <>Try other filters. <a href="/portal/admin/applications">Show all</a>.</> : "Applications show up here as soon as job seekers apply."}</Empty> : (
          <ul className="rows crows">
            {shown.map((a) => (
              <li key={a.id}>
                <div className="crows__who">
                  <a className="rows__title" href={`/portal/admin/candidates/${a.seeker_id}`}>{a.profiles?.full_name || a.profiles?.email || "Candidate"}</a>
                  <span className="soft small">{a.jobs ? <a href={`/portal/admin/jobs/${a.jobs.id}`}>{a.jobs.title}</a> : "Job removed"} · {a.jobs?.companies?.name ?? "RemoteCore"}{a.profiles?.country ? ` · ${a.profiles.country}` : ""}</span>
                </div>
                <span className="soft small nowrap">Applied {ago(a.created_at)}</span>
                <AdminAppStatus appId={a.id} status={a.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
