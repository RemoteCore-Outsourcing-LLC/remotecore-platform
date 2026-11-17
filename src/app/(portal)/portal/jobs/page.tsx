import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { JOB_COLUMNS, type JobRow } from "@/lib/portal/seeker";
import { JobCard, Empty, PageHead } from "@/components/portal/Dash";

export const metadata: Metadata = { title: "Jobs", robots: { index: false } };

export default async function JobsPage() {
  const { sb, user } = await getSession();
  if (!user) return null;
  const [jobs, saved] = await Promise.all([
    sb.from("jobs").select(JOB_COLUMNS).eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(50),
    sb.from("saved_jobs").select("job_id").eq("user_id", user.id),
  ]);
  const list = (jobs.data ?? []) as unknown as JobRow[];
  const savedIds = new Set((saved.data ?? []).map((r) => r.job_id));
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Jobs" sub={list.length ? `${list.length} open remote ${list.length === 1 ? "role" : "roles"}, newest first.` : undefined} />
      {list.length === 0
        ? <Empty title="No open jobs right now" action={<a className="btn btn--ghost btn--sm" href="/portal/profile">Check your profile</a>}>New remote roles are added often. A complete profile lets you apply the moment one opens.</Empty>
        : <div className="jobs">{list.map((j) => <JobCard key={j.id} job={j} saved={savedIds.has(j.id)} />)}</div>}
    </div>
  );
}
