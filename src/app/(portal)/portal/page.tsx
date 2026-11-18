import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { profileProgress, PROFILE_SECTIONS, JOB_COLUMNS, ago, type JobRow } from "@/lib/portal/seeker";
import { JobCard, StatusPill, Empty } from "@/components/portal/Dash";
import { ApprovalSteps, CompanyFacts, CompanyPill, type Company } from "@/components/portal/Employer";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function PortalHome() {
  const { sb, user, profile } = await getSession();
  if (!user || !profile) return null;
  if (profile.role === "employer") {
    const { data } = await sb.from("companies").select("*").eq("owner_id", user.id).maybeSingle();
    const c = data as Company | null;
    const first = (c?.contact_person || profile.full_name || "").split(" ")[0];
    if (!c) return <div className="pwrap"><Empty title="We could not find your company">Please contact RemoteCore and we will fix this for you.</Empty></div>;
    return (
      <div className="pwrap">
        <header className="phead">
          <h1>{first ? `Welcome, ${first}` : "Welcome"}</h1>
          <p>{c.name}</p>
        </header>
        {c.status === "approved" ? (
          <section className="banner banner--ok" aria-labelledby="eok">
            <div><h2 id="eok">Your company account is approved</h2><p>You can post jobs, send staffing requests and review candidates.</p></div>
            <div className="banner__act"><a className="btn btn--ghost" href="/portal/company">Edit company profile</a></div>
          </section>
        ) : c.status === "suspended" ? (
          <section className="banner" aria-labelledby="esus">
            <div><h2 id="esus">Your company account is paused</h2><p>Please contact RemoteCore to reopen it.</p></div>
            <div className="banner__act"><a className="btn btn--main" href="/contact">Contact us</a></div>
          </section>
        ) : (
          <section className="banner" aria-labelledby="ewait">
            <div className="banner__grow"><h2 id="ewait">We are reviewing your company</h2><p>We check every new company account before it opens. We will email <b>{c.email}</b> as soon as it is approved.</p></div>
            <div className="banner__act"><a className="btn btn--ghost" href="/portal/company">Check your details</a></div>
          </section>
        )}
        <div className="dgrid" style={{ marginTop: 20 }}>
          <section className="panel" aria-labelledby="steps-h">
            <header className="panel__head"><h2 id="steps-h">Getting started</h2></header>
            <div className="epanel__body"><ApprovalSteps status={c.status} /></div>
          </section>
          <section className="panel" aria-labelledby="co-h">
            <header className="panel__head"><h2 id="co-h">Your company</h2><a href="/portal/company">Edit</a></header>
            <div className="epanel__body epanel"><div><CompanyPill status={c.status} /></div><CompanyFacts c={c} /></div>
          </section>
        </div>
      </div>
    );
  }
  if (profile.role !== "job_seeker") {
    return <div className="pwrap"><Empty title="Your dashboard is on its way">RemoteCore is setting up this part of the platform. We will email you when it is ready.</Empty></div>;
  }

  const head = { count: "exact" as const, head: true };
  const [progress, apps, appCount, savedCount, unread, jobs, notes] = await Promise.all([
    profileProgress(sb, user.id, profile),
    sb.from("applications").select("id, status, created_at, updated_at, jobs(id, title)").eq("seeker_id", user.id).order("updated_at", { ascending: false }).limit(4),
    sb.from("applications").select("id", head).eq("seeker_id", user.id),
    sb.from("saved_jobs").select("job_id", head).eq("user_id", user.id),
    sb.from("notifications").select("id", head).eq("user_id", user.id).is("read_at", null),
    sb.from("jobs").select(JOB_COLUMNS).eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(3),
    sb.from("notifications").select("id, title, body, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
  ]);
  const jobList = (jobs.data ?? []) as unknown as JobRow[];
  const { data: savedRows } = jobList.length
    ? await sb.from("saved_jobs").select("job_id").eq("user_id", user.id).in("job_id", jobList.map((j) => j.id))
    : { data: [] };
  const savedIds = new Set((savedRows ?? []).map((r) => r.job_id));
  const first = (profile.full_name || "").split(" ")[0];
  const missing = PROFILE_SECTIONS.filter(([k]) => !progress.done[k]);

  return (
    <div className="pwrap">
      <header className="phead">
        <h1>{first ? `Welcome back, ${first}` : "Welcome back"}</h1>
        <p>Your applications, saved jobs and messages from RemoteCore, all in one place.</p>
      </header>

      {progress.complete ? (
        <section className="banner banner--ok" aria-labelledby="pdone">
          <div>
            <h2 id="pdone">Your profile is complete</h2>
            <p>Employers see all of it when you apply. Keep it up to date as things change.</p>
          </div>
          <div className="banner__act">
            <a className="btn btn--main" href="/portal/jobs">Browse jobs</a>
            <a className="btn btn--ghost" href="/portal/profile">Edit profile</a>
          </div>
        </section>
      ) : (
        <section className="banner" aria-labelledby="pnext">
          <div className="banner__grow">
            <h2 id="pnext">Finish your profile</h2>
            <p><b>{progress.count} of {progress.total}</b> sections done. Complete profiles get reviewed first.</p>
            <div className="meter" role="progressbar" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.count} aria-label="Profile sections done"><i style={{ width: `${(progress.count / progress.total) * 100}%` }} /></div>
            <ul className="todo">
              {missing.slice(0, 4).map(([k, label]) => <li key={k}><a href={`/portal/profile#${k}`}>{label}</a></li>)}
              {missing.length > 4 && <li className="soft">and {missing.length - 4} more</li>}
            </ul>
          </div>
          <div className="banner__act"><a className="btn btn--main" href={`/portal/profile#${missing[0]?.[0] ?? "about"}`}>Continue profile</a></div>
        </section>
      )}

      <ul className="tally" aria-label="Summary">
        <li><a href="/portal/applications"><b>{appCount.count ?? 0}</b> {appCount.count === 1 ? "application" : "applications"}</a></li>
        <li><a href="/portal/saved"><b>{savedCount.count ?? 0}</b> saved {savedCount.count === 1 ? "job" : "jobs"}</a></li>
        <li><a href="/portal/notifications"><b>{unread.count ?? 0}</b> unread {unread.count === 1 ? "notification" : "notifications"}</a></li>
      </ul>

      <div className="dgrid">
        <section className="panel" aria-labelledby="apps-h">
          <header className="panel__head"><h2 id="apps-h">Your applications</h2>{(appCount.count ?? 0) > 0 && <a href="/portal/applications">See all</a>}</header>
          {(apps.data ?? []).length === 0 ? (
            <Empty title="No applications yet">When you apply to a job, you can follow every step here.</Empty>
          ) : (
            <ul className="rows">
              {(apps.data ?? []).map((a) => {
                const job = a.jobs as unknown as { id: string; title: string } | null;
                return (
                  <li key={a.id}>
                    <div><a href="/portal/applications" className="rows__title">{job?.title ?? "Job no longer listed"}</a><span className="soft small">Updated {ago(a.updated_at)}</span></div>
                    <StatusPill status={a.status} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="notes-h">
          <header className="panel__head"><h2 id="notes-h">Notifications</h2>{(notes.data ?? []).length > 0 && <a href="/portal/notifications">See all</a>}</header>
          {(notes.data ?? []).length === 0 ? (
            <Empty title="Nothing new">Updates about your applications show up here and in your email.</Empty>
          ) : (
            <ul className="rows">
              {(notes.data ?? []).map((n) => (
                <li key={n.id} className={n.read_at ? "" : "is-unread"}>
                  <div><span className="rows__title">{n.title}</span>{n.body && <span className="soft small clamp">{n.body}</span>}</div>
                  <span className="soft small nowrap">{ago(n.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel--wide" aria-labelledby="jobs-h">
          <header className="panel__head"><h2 id="jobs-h">New jobs</h2><a href="/portal/jobs">Browse all jobs</a></header>
          {jobList.length === 0 ? (
            <Empty title="No open jobs right now">New remote roles are added often. Save time by finishing your profile now, so you can apply the moment one opens.</Empty>
          ) : (
            <div className="jobs">{jobList.map((j) => <JobCard key={j.id} job={j} saved={savedIds.has(j.id)} />)}</div>
          )}
        </section>
      </div>
    </div>
  );
}
