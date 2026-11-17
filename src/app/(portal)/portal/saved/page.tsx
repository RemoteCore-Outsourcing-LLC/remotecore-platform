import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { JOB_COLUMNS, type JobRow } from "@/lib/portal/seeker";
import { JobCard, Empty, PageHead } from "@/components/portal/Dash";

export const metadata: Metadata = { title: "Saved jobs", robots: { index: false } };

export default async function SavedPage() {
  const { sb, user } = await getSession();
  if (!user) return null;
  const { data } = await sb.from("saved_jobs").select(`created_at, jobs(${JOB_COLUMNS}, status)`).eq("user_id", user.id).order("created_at", { ascending: false });
  // Jobs that closed since they were saved are left out.
  const list = (data ?? []).map((r) => r.jobs as unknown as (JobRow & { status: string }) | null).filter((j): j is JobRow & { status: string } => !!j && j.status === "published");
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Saved jobs" sub={list.length ? "Jobs you saved for later. Saved jobs that close drop off this list." : undefined} />
      {list.length === 0
        ? <Empty title="No saved jobs" action={<a className="btn btn--main btn--sm" href="/portal/jobs">Browse jobs</a>}>Tap Save on any job to keep it here.</Empty>
        : <div className="jobs">{list.map((j) => <JobCard key={j.id} job={j} saved />)}</div>}
    </div>
  );
}
