import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { companyApplicants, countByStatus, STATUS_ORDER, OPEN_STATUSES } from "@/lib/portal/candidates";
import { APP_STATUS, ago } from "@/lib/portal/seeker";
import { PageHead, Empty, StatusPill } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";

export const metadata: Metadata = { title: "Candidates", robots: { index: false } };

type Search = { job?: string; status?: string };

export default async function Candidates({ searchParams }: { searchParams: Promise<Search> }) {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const { job = "", status = "" } = await searchParams;

  const all = await companyApplicants(sb, company.id);
  const jobs = Array.from(new Map(all.map((a) => [a.job.id, a.job])).values()).sort((a, b) => a.title.localeCompare(b.title));
  const jobId = jobs.some((j) => j.id === job) ? job : "";
  const inJob = jobId ? all.filter((a) => a.job.id === jobId) : all;
  const counts = countByStatus(inJob);
  const open = inJob.filter((a) => OPEN_STATUSES.includes(a.status)).length;
  const st = status === "open" || STATUS_ORDER.includes(status) ? status : "";
  const shown = st === "open" ? inJob.filter((a) => OPEN_STATUSES.includes(a.status)) : st ? inJob.filter((a) => a.status === st) : inJob;
  const href = (s: string) => {
    const q = new URLSearchParams();
    if (jobId) q.set("job", jobId);
    if (s) q.set("status", s);
    const qs = q.toString();
    return `/portal/candidates${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="pwrap">
      <PageHead title="Candidates" sub="Everyone who applied to your jobs. Open a candidate to see their profile, resume and voice intro, and move them forward." />
      {all.length === 0 ? (
        <Empty title="No applicants yet" action={<a className="btn btn--main btn--sm" href="/portal/postings">See your jobs</a>}>When someone applies to one of your live jobs, they show up here and we email you.</Empty>
      ) : (
        <>
          <div className="cfilter">
            {jobs.length > 1 && (
              <form className="cfilter__job" action="/portal/candidates">
                <label className="field"><span>Job</span>
                  <select name="job" defaultValue={jobId}>
                    <option value="">All jobs ({all.length})</option>
                    {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </label>
                {st && <input type="hidden" name="status" value={st} />}
                <button className="btn btn--ghost btn--sm">Show</button>
              </form>
            )}
            <nav className="seg" aria-label="Filter by status">
              <a href={href("")} aria-current={!st ? "page" : undefined}>All <b>{inJob.length}</b></a>
              <a href={href("open")} aria-current={st === "open" ? "page" : undefined}>Waiting on you <b>{open}</b></a>
              {STATUS_ORDER.filter((s) => counts[s] > 0 || s === st).map((s) => (
                <a key={s} href={href(s)} aria-current={st === s ? "page" : undefined}>{APP_STATUS[s].label} <b>{counts[s]}</b></a>
              ))}
            </nav>
          </div>
          <section className="panel" aria-label="Applicants">
            {shown.length === 0 ? (
              <Empty title="Nobody here">No candidates have this status right now. <a href={href("")}>Show everyone</a>.</Empty>
            ) : (
              <ul className="rows crows">
                {shown.map((a) => (
                  <li key={a.id}>
                    <div className="crows__who">
                      <a className="rows__title" href={`/portal/candidates/${a.id}`}>{a.name}</a>
                      <span className="soft small">{[a.headline, a.country, a.years != null ? `${a.years} ${a.years === 1 ? "year" : "years"} experience` : null].filter(Boolean).join(" · ") || "Profile details inside"}</span>
                      {a.skills.length > 0 && <span className="crows__skills small">{a.skills.slice(0, 4).join(" · ")}</span>}
                    </div>
                    <div className="crows__job">
                      {!jobId && <span className="small">{a.job.title}</span>}
                      <span className="soft small">Applied {ago(a.created_at)}</span>
                    </div>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
