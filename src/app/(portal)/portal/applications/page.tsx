import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { APP_STATUS } from "@/lib/portal/seeker";
import { StatusPill, StatusTrack, Empty, PageHead } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "My applications", robots: { index: false } };

type Hist = { to_status: string; changed_at: string };

export default async function ApplicationsPage() {
  const { sb, user } = await getSession();
  if (!user) return null;
  const { data } = await sb.from("applications")
    .select("id, status, created_at, updated_at, extra_documents, jobs(id, title, status), application_status_history(to_status, changed_at)")
    .eq("seeker_id", user.id).order("updated_at", { ascending: false });
  const apps = data ?? [];
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="My applications" sub={apps.length ? "Every job you applied to and where it stands. We also email you when a status changes." : undefined} />
      {apps.length === 0 ? (
        <Empty title="No applications yet" action={<a className="btn btn--main btn--sm" href="/portal/jobs">Browse jobs</a>}>When you apply to a job, you can follow every step here.</Empty>
      ) : (
        <div className="apps">
          {apps.map((a) => {
            const job = a.jobs as unknown as { id: string; title: string; status: string } | null;
            const hist = ((a.application_status_history ?? []) as Hist[]).slice().sort((x, y) => y.changed_at.localeCompare(x.changed_at));
            return (
              <article key={a.id} className="app">
                <header className="app__head">
                  <div>
                    <h2>{job ? <a href={`/portal/jobs/${job.id}`}>{job.title}</a> : "Job no longer listed"}</h2>
                    <p className="soft small">Applied <LocalTime iso={a.created_at} />{a.extra_documents?.length ? ` · Resume and ${a.extra_documents.length} ${a.extra_documents.length === 1 ? "document" : "documents"} sent` : " · Resume sent"}{job && job.status !== "published" ? " · This job is closed" : ""}</p>
                  </div>
                  <StatusPill status={a.status} />
                </header>
                <StatusTrack status={a.status} />
                {hist.length > 1 && (
                  <details className="app__hist">
                    <summary>History</summary>
                    <ol>{hist.map((h, i) => <li key={i}><span>{APP_STATUS[h.to_status]?.label ?? h.to_status}</span><span className="soft"><LocalTime iso={h.changed_at} /></span></li>)}</ol>
                  </details>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
