import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { JOB_COLUMNS, jobFacts, pay, shortDate, type JobRow } from "@/lib/portal/seeker";
import { company } from "@/lib/site";
import "@/components/jobs/jobsearch.css";

type Job = JobRow & { status: string; qualifications: string | null; computer_requirements: string | null };

// Only open jobs: row level security hides unpublished ones, and closed or expired ones are treated as gone.
const getJob = cache(async (id: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const sb = await supabaseServer();
  const { data } = await sb.from("jobs").select(`${JOB_COLUMNS}, qualifications, computer_requirements, status`).eq("id", id).eq("status", "published").maybeSingle();
  const j = data as unknown as Job | null;
  if (!j || (j.deadline && j.deadline < new Date().toISOString().slice(0, 10))) return null;
  return j;
});

const plain = (s: string) => s.trim();

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const j = await getJob((await params).id);
  if (!j) return { title: "Job not found" };
  return { title: `${j.title}, remote job`, description: plain(j.description).slice(0, 155), alternates: { canonical: `/jobs/${j.id}` } };
}

export default async function PublicJobPage({ params }: { params: Promise<{ id: string }> }) {
  const j = await getJob((await params).id);
  if (!j) notFound();
  const p = pay(j);
  const unit = ({ hour: "HOUR", week: "WEEK", month: "MONTH", year: "YEAR" } as Record<string, string>)[j.salary_period ?? "month"] ?? "MONTH";
  const posting = {
    "@context": "https://schema.org", "@type": "JobPosting",
    title: j.title, description: plain(j.description), datePosted: (j.published_at ?? j.created_at).slice(0, 10),
    ...(j.deadline ? { validThrough: j.deadline } : {}),
    employmentType: (j.employment_type ?? "full_time").toUpperCase(),
    hiringOrganization: { "@type": "Organization", name: company.name },
    jobLocationType: "TELECOMMUTE",
    applicantLocationRequirements: j.remote_type === "location_restricted" && j.location_restrictions
      ? j.location_restrictions.split(/,| or /).map((x) => ({ "@type": "Country", name: x.trim() })).filter((x) => x.name)
      : { "@type": "Country", name: "Worldwide" },
    ...(j.salary_min || j.salary_max ? { baseSalary: { "@type": "MonetaryAmount", currency: j.salary_currency || "USD", value: { "@type": "QuantitativeValue", ...(j.salary_min ? { minValue: j.salary_min } : {}), ...(j.salary_max ? { maxValue: j.salary_max } : {}), unitText: unit } } } : {}),
    skills: j.skills.join(", "),
  };
  return (
    <section className="sec sec--pale jobpage">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(posting).replace(/</g, "\\u003c") }} />
      <div className="wrap jobboard">
        <p className="jobpage__back"><a href="/find-opportunities#jobs">All open jobs</a></p>
        <article className="jobpage__card">
          <header>
            <p className="pj__cat">{j.job_categories?.name ?? "Remote role"}</p>
            <h1>{j.title}</h1>
            <ul className="pj__facts">{jobFacts(j).map((x) => <li key={x}>{x}</li>)}{p && <li>{p}</li>}</ul>
            <div className="jobpage__cta">
              <a className="btn btn--main" href={`/portal/jobs/${j.id}`}>Apply for this job</a>
              <span className="soft">New here? <a href="/register/job-seeker">Create your free profile</a> first.</span>
            </div>
          </header>
          <div className="jobpage__body">
            <section><h2>About the role</h2><p>{j.description}</p></section>
            {j.skills.length > 0 && <section><h2>Skills</h2><p>{j.skills.join(", ")}</p></section>}
            {j.qualifications && <section><h2>Qualifications</h2><p>{j.qualifications}</p></section>}
            {j.computer_requirements && <section><h2>Computer and internet</h2><p>{j.computer_requirements}</p></section>}
            <dl>
              {j.hours_time_zone && <><dt>Hours and time zone</dt><dd>{j.hours_time_zone}</dd></>}
              {j.deadline && <><dt>Apply by</dt><dd>{shortDate(j.deadline)}</dd></>}
              <dt>Posted</dt><dd>{shortDate(j.published_at ?? j.created_at)}</dd>
            </dl>
          </div>
        </article>
      </div>
    </section>
  );
}
