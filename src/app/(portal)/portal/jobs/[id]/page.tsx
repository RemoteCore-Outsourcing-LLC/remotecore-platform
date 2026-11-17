import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { JOB_COLUMNS, jobFacts, pay, shortDate, type JobRow } from "@/lib/portal/seeker";
import { StatusPill } from "@/components/portal/Dash";
import { SaveJobButton } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "Job", robots: { index: false } };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, user } = await getSession();
  if (!user) return null;
  const [job, saved, app] = await Promise.all([
    sb.from("jobs").select(`${JOB_COLUMNS}, qualifications, computer_requirements, status`).eq("id", id).maybeSingle(),
    sb.from("saved_jobs").select("job_id").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    sb.from("applications").select("status").eq("seeker_id", user.id).eq("job_id", id).maybeSingle(),
  ]);
  if (!job.data) notFound();
  const j = job.data as unknown as JobRow & { status: string };
  const p = pay(j);
  const open = j.status === "published";
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/jobs">All jobs</a></p>
      <article className="jobdoc">
        <header className="jobdoc__head">
          <p className="job__cat">{j.job_categories?.name ?? "Remote role"}</p>
          <h1>{j.title}</h1>
          <ul className="job__facts">{jobFacts(j).map((f) => <li key={f}>{f}</li>)}{p && <li>{p}</li>}</ul>
          <div className="jobdoc__act">
            {app.data ? <StatusPill status={app.data.status} /> : null}
            {open ? <SaveJobButton jobId={j.id} saved={!!saved.data} /> : <span className="pill">No longer open</span>}
          </div>
        </header>
        <div className="jobdoc__body">
          <section><h2>About the role</h2><p className="prose">{j.description}</p></section>
          {j.skills.length > 0 && <section><h2>Skills</h2><ul className="chips">{j.skills.map((s) => <li key={s} className="pill">{s}</li>)}</ul></section>}
          {j.qualifications && <section><h2>Qualifications</h2><p className="prose">{j.qualifications}</p></section>}
          {j.computer_requirements && <section><h2>Computer and internet</h2><p className="prose">{j.computer_requirements}</p></section>}
          <dl className="facts">
            {j.hours_time_zone && <><dt>Hours and time zone</dt><dd>{j.hours_time_zone}</dd></>}
            {j.deadline && <><dt>Apply by</dt><dd>{shortDate(j.deadline)}</dd></>}
            {j.published_at && <><dt>Posted</dt><dd>{shortDate(j.published_at)}</dd></>}
          </dl>
        </div>
      </article>
    </div>
  );
}
