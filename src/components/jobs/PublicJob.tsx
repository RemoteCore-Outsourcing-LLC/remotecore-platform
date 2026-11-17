import { jobFacts, pay, ago, type JobRow } from "@/lib/portal/seeker";
import "./jobsearch.css";

export function PublicJobCard({ job }: { job: JobRow }) {
  const p = pay(job);
  return (
    <article className="pj">
      <div className="pj__main">
        <p className="pj__cat">{job.job_categories?.name ?? "Remote role"}</p>
        <h3><a href={`/jobs/${job.id}`}>{job.title}</a></h3>
        <ul className="pj__facts">{jobFacts(job).map((x) => <li key={x}>{x}</li>)}{p && <li>{p}</li>}</ul>
        {job.skills.length > 0 && <p className="pj__skills">{job.skills.slice(0, 5).join(" · ")}</p>}
      </div>
      <div className="pj__side">
        <span>{ago(job.published_at ?? job.created_at)}</span>
        <a className="pj__view" href={`/jobs/${job.id}`} aria-label={`View ${job.title}`}>View job</a>
      </div>
    </article>
  );
}
