import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { readFilters, searchJobs, categories, PER_PAGE, activeCount } from "@/lib/jobs/search";
import { JobSearch, ResultsHead, Pager } from "@/components/jobs/JobSearch";
import { JobCard, Empty, PageHead } from "@/components/portal/Dash";

export const metadata: Metadata = { title: "Jobs", robots: { index: false } };

export default async function JobsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const f = readFilters(await searchParams);
  const { sb, user } = await getSession();
  if (!user) return null;
  const [res, cats, saved] = await Promise.all([
    searchJobs(sb, f), categories(sb),
    sb.from("saved_jobs").select("job_id").eq("user_id", user.id),
  ]);
  const savedIds = new Set((saved.data ?? []).map((r) => r.job_id));
  const searching = !!f.q || activeCount(f) > 0;
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Jobs" sub="Every open remote role. Search by title, skill or industry, then narrow it down." />
      <JobSearch base="/portal/jobs" f={f} cats={cats} />
      {res.failed ? (
        <Empty title="Search is not working right now">Please try again in a minute.</Empty>
      ) : res.jobs.length === 0 ? (
        <div style={{ marginTop: 20 }}>
          <Empty title={searching ? "No jobs match this search" : "No open jobs right now"} action={searching ? <a className="btn btn--ghost btn--sm" href="/portal/jobs">Clear the search</a> : undefined}>
            {searching ? "Try fewer words or remove a filter." : "New remote roles are added often. A complete profile lets you apply the moment one opens."}
          </Empty>
        </div>
      ) : (
        <>
          <ResultsHead total={res.total} f={f} />
          <div className="jobs">{res.jobs.map((j) => <JobCard key={j.id} job={j} saved={savedIds.has(j.id)} />)}</div>
          <Pager base="/portal/jobs" f={f} total={res.total} per={PER_PAGE} />
        </>
      )}
    </div>
  );
}
