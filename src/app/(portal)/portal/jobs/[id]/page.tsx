import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { JOB_COLUMNS, jobFacts, pay, shortDate, profileProgress, type JobRow } from "@/lib/portal/seeker";
import { ApplyPanel } from "@/components/portal/ApplyPanel";
import { StatusPill } from "@/components/portal/Dash";
import { SaveJobButton, LocalTime } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "Job", robots: { index: false } };

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { sb, user, profile } = await getSession();
  if (!user || !profile) return null;
  const [job, saved, app] = await Promise.all([
    sb.from("jobs").select(`${JOB_COLUMNS}, qualifications, computer_requirements, documents_required, status`).eq("id", id).maybeSingle(),
    sb.from("saved_jobs").select("job_id").eq("user_id", user.id).eq("job_id", id).maybeSingle(),
    sb.from("applications").select("status, created_at").eq("seeker_id", user.id).eq("job_id", id).maybeSingle(),
  ]);
  if (!job.data) notFound();
  const j = job.data as unknown as JobRow & { status: string; documents_required: string | null };
  const p = pay(j);
  const open = j.status === "published" && !(j.deadline && j.deadline < new Date().toISOString().slice(0, 10));
  const seeker = profile.role === "job_seeker";
  let apply = null;
  if (seeker && open && !app.data) {
    const [progress, sp] = await Promise.all([
      profileProgress(sb, user.id, profile),
      sb.from("seeker_profiles").select("headline, resume_path, audio_path").eq("user_id", user.id).maybeSingle(),
    ]);
    apply = <ApplyPanel jobId={j.id} jobTitle={j.title} userId={user.id} docsRequired={j.documents_required}
      profile={{ name: profile.full_name, headline: sp.data?.headline ?? "", resume: !!sp.data?.resume_path, audio: !!sp.data?.audio_path, done: progress.count, total: progress.total }} />;
  }
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
            {apply && <a className="btn btn--main btn--sm" href="#apply">Apply now</a>}
            {open ? <SaveJobButton jobId={j.id} saved={!!saved.data} /> : <span className="pill">No longer open</span>}
          </div>
        </header>
        <div className="jobdoc__body">
          <section><h2>About the role</h2><p className="prose">{j.description}</p></section>
          {j.skills.length > 0 && <section><h2>Skills</h2><ul className="chips">{j.skills.map((s) => <li key={s} className="pill">{s}</li>)}</ul></section>}
          {j.qualifications && <section><h2>Qualifications</h2><p className="prose">{j.qualifications}</p></section>}
          {j.computer_requirements && <section><h2>Computer and internet</h2><p className="prose">{j.computer_requirements}</p></section>}
          {j.documents_required && <section><h2>Documents to include</h2><p className="prose">{j.documents_required}</p></section>}
          <dl className="facts">
            {j.hours_time_zone && <><dt>Hours and time zone</dt><dd>{j.hours_time_zone}</dd></>}
            {j.deadline && <><dt>Apply by</dt><dd>{shortDate(j.deadline)}</dd></>}
            {j.published_at && <><dt>Posted</dt><dd>{shortDate(j.published_at)}</dd></>}
          </dl>
        </div>
      </article>
      {app.data && (
        <section className="apply apply--sent" aria-label="Your application">
          <div><h2>You applied for this job</h2><p className="soft">Sent <LocalTime iso={app.data.created_at} /></p></div>
          <a className="btn btn--ghost btn--sm" href="/portal/applications">Track it</a>
        </section>
      )}
      {apply}
    </div>
  );
}
