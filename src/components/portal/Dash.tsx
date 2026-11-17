import type { ReactNode } from "react";
import { APP_STATUS, APP_STEPS, jobFacts, pay, ago, type JobRow } from "@/lib/portal/seeker";
import { SaveJobButton } from "./DashClient";

export function StatusPill({ status }: { status: string }) {
  const s = APP_STATUS[status] ?? { label: status, tone: "neutral" };
  return <span className={`pill pill--${s.tone}`}>{s.label}</span>;
}

// Five step track. The last step reads as the decision once one is made.
export function StatusTrack({ status }: { status: string }) {
  const s = APP_STATUS[status] ?? APP_STATUS.application_received;
  const steps = APP_STEPS.map((l, i) => (i === 4 && s.step === 4 ? s.label : l));
  return (
    <ol className={`track track--${s.tone}`} aria-label={`Progress: ${s.label}`}>
      {steps.map((l, i) => (
        <li key={l} className={i < s.step ? "is-past" : i === s.step ? "is-now" : ""} aria-current={i === s.step ? "step" : undefined}><span>{l}</span></li>
      ))}
    </ol>
  );
}

export function JobCard({ job, saved, extra }: { job: JobRow; saved: boolean; extra?: ReactNode }) {
  const p = pay(job);
  return (
    <article className="job">
      <div className="job__main">
        <p className="job__cat">{job.job_categories?.name ?? "Remote role"}</p>
        <h3><a href={`/portal/jobs/${job.id}`}>{job.title}</a></h3>
        <ul className="job__facts">
          {jobFacts(job).map((f) => <li key={f}>{f}</li>)}
          {p && <li>{p}</li>}
        </ul>
        {job.skills.length > 0 && <p className="job__skills">{job.skills.slice(0, 5).join(" · ")}</p>}
      </div>
      <div className="job__side">
        <span className="soft small">{ago(job.published_at ?? job.created_at)}</span>
        <SaveJobButton jobId={job.id} saved={saved} compact />
        {extra}
      </div>
    </article>
  );
}

export function Empty({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p className="soft">{children}</p>}
      {action}
    </div>
  );
}

export function PageHead({ title, sub, aside }: { title: string; sub?: string; aside?: ReactNode }) {
  return (
    <header className="phead phead--row">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {aside}
    </header>
  );
}
