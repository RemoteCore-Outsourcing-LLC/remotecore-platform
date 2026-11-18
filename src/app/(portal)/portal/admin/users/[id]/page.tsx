import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin, ACCOUNT_STATUS, ROLE_LABEL, LEVEL_LABEL, LOG_LABEL } from "@/lib/portal/admin";
import { profileProgress, APP_STATUS } from "@/lib/portal/seeker";
import { CompanyFacts, CompanyPill, type Company } from "@/components/portal/Employer";
import { LocalTime } from "@/components/portal/DashClient";
import { AccountStatusButtons, CompanyStatusButtons, AdminLevelSelect, DeleteAccountBox } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

type Log = { id: number; action: string; details: Record<string, string> | null; created_at: string; profiles: { full_name: string; email: string } | null };

export default async function Account({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, admin, owner } = await getAdmin();
  if (!admin || !user || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: p } = await sb.from("profiles").select("id, role, status, full_name, email, phone, country, created_at, admin_level").eq("id", id).maybeSingle();
  if (!p) notFound();
  const self = p.id === user.id;
  const head = { count: "exact" as const, head: true };

  const [companyRes, logRes] = await Promise.all([
    p.role === "employer" ? sb.from("companies").select("*").eq("owner_id", id).maybeSingle() : Promise.resolve({ data: null }),
    sb.from("admin_log").select("id, action, details, created_at, profiles!admin_log_actor_id_fkey(full_name, email)").eq("target", id).order("created_at", { ascending: false }).limit(20),
  ]);
  const company = companyRes.data as Company | null;
  let companyLog: Log[] = [];
  if (company) {
    const { data } = await sb.from("admin_log").select("id, action, details, created_at, profiles!admin_log_actor_id_fkey(full_name, email)").eq("target", company.id).order("created_at", { ascending: false }).limit(20);
    companyLog = (data ?? []) as unknown as Log[];
  }
  const log = [...((logRes.data ?? []) as unknown as Log[]), ...companyLog].sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Job seekers: profile progress and applications. Employers: jobs and applicants.
  let seeker: { progress: Awaited<ReturnType<typeof profileProgress>>; apps: { id: string; status: string; created_at: string; jobs: { title: string } | null }[] } | null = null;
  let employer: { jobs: number; live: number; applicants: number } | null = null;
  if (p.role === "job_seeker") {
    const [progress, apps] = await Promise.all([
      profileProgress(sb, id, p),
      sb.from("applications").select("id, status, created_at, jobs(title)").eq("seeker_id", id).order("created_at", { ascending: false }).limit(20),
    ]);
    seeker = { progress, apps: (apps.data ?? []) as unknown as NonNullable<typeof seeker>["apps"] };
  } else if (company) {
    const [jobs, live, applicants] = await Promise.all([
      sb.from("jobs").select("id", head).eq("company_id", company.id),
      sb.from("jobs").select("id", head).eq("company_id", company.id).eq("status", "published"),
      sb.from("applications").select("id, jobs!inner(company_id)", head).eq("jobs.company_id", company.id),
    ]);
    employer = { jobs: jobs.count ?? 0, live: live.count ?? 0, applicants: applicants.count ?? 0 };
  }

  const s = ACCOUNT_STATUS[p.status];
  const canChange = !self && (p.role !== "admin" || owner);
  const what = p.role === "employer" ? "this login, the company, all its jobs and the applications to those jobs" : p.role === "job_seeker" ? "this login, the profile, the resume, the voice intro and every application" : "this team login";

  return (
    <div className="pwrap">
      <p className="crumb"><a href={`/portal/admin/users?tab=${p.role}`}>{p.role === "employer" ? "Employers" : p.role === "admin" ? "Team" : "Job seekers"}</a></p>
      <div className="cand">
        <div className="cand__main stack">
          <article className="jobdoc">
            <header className="jobdoc__head">
              <div className="cand__title">
                <h1>{company?.name ?? (p.full_name || p.email)}</h1>
                <span className={`pill pill--${s?.tone ?? "neutral"}`}>{s?.label ?? p.status}</span>
                {company && <CompanyPill status={company.status} />}
              </div>
              <p className="soft small">{ROLE_LABEL[p.role]}{p.admin_level ? `, ${LEVEL_LABEL[p.admin_level]}` : ""} · Joined <LocalTime iso={p.created_at} /></p>
            </header>
            <div className="jobdoc__body">
              <section aria-labelledby="login-h">
                <h2 id="login-h">Login</h2>
                <dl className="facts">
                  <dt>Name</dt><dd>{p.full_name || "Not given"}</dd>
                  <dt>Email</dt><dd><a href={`mailto:${p.email}`}>{p.email}</a></dd>
                  {p.phone && <><dt>Phone</dt><dd>{p.phone}</dd></>}
                  {p.country && <><dt>Country</dt><dd>{p.country}</dd></>}
                </dl>
              </section>
              {company && (
                <section aria-labelledby="co-h">
                  <h2 id="co-h">Company</h2>
                  <CompanyFacts c={company} />
                  {company.description && <p className="prose" style={{ marginTop: 12 }}>{company.description}</p>}
                </section>
              )}
              {employer && (
                <section aria-labelledby="hire-h">
                  <h2 id="hire-h">Hiring</h2>
                  <p>{employer.jobs} {employer.jobs === 1 ? "job" : "jobs"}, {employer.live} live, {employer.applicants} {employer.applicants === 1 ? "applicant" : "applicants"}.</p>
                </section>
              )}
              {seeker && (
                <section aria-labelledby="prof-h">
                  <h2 id="prof-h">Profile</h2>
                  <p>{seeker.progress.count} of {seeker.progress.total} profile sections done.</p>
                  {seeker.apps.length > 0 ? (
                    <ul className="alist">
                      {seeker.apps.map((a) => <li key={a.id}><span>{a.jobs?.title ?? "Job removed"}</span><span className="soft small">{APP_STATUS[a.status]?.label ?? a.status}</span></li>)}
                    </ul>
                  ) : <p className="soft small">No applications yet.</p>}
                </section>
              )}
              <section aria-labelledby="log-h">
                <h2 id="log-h">Activity by the team</h2>
                {log.length === 0 ? <p className="soft small">No changes by the team yet.</p> : (
                  <ol className="alog">
                    {log.map((l) => (
                      <li key={l.id}>
                        <span>{LOG_LABEL[l.action] ?? l.action}{l.details?.to ? `: ${l.details.from ?? "?"} to ${l.details.to}` : ""}</span>
                        <span className="soft small">{l.profiles?.full_name || l.profiles?.email || "Someone who left"} · <LocalTime iso={l.created_at} /></span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>
          </article>
        </div>

        <aside className="cand__side" aria-label="Actions">
          {company && (
            <section className="panel cside">
              <header className="panel__head"><h2>Company approval</h2></header>
              <div className="cside__body">
                <p className="soft small">{company.status === "pending" ? "This company is waiting for you. Approving it lets them post jobs and see candidates who apply. We email them." : company.status === "approved" ? `Approved${company.approved_at ? " on " : ""}${company.approved_at ? new Date(company.approved_at).toLocaleDateString("en-US", { dateStyle: "medium" }) : ""}.` : "Suspended. They cannot post jobs or see candidates."}</p>
                <CompanyStatusButtons companyId={company.id} status={company.status} />
              </div>
            </section>
          )}
          <section className="panel cside">
            <header className="panel__head"><h2>Account</h2></header>
            <div className="cside__body">
              <p className="soft small">{s?.help}</p>
              {canChange ? <AccountStatusButtons userId={p.id} status={p.status} /> : <p className="soft small">{self ? "This is your own account. Another owner can change it." : "Only an owner can change team accounts."}</p>}
            </div>
          </section>
          {p.role === "admin" && owner && !self && (
            <section className="panel cside">
              <header className="panel__head"><h2>Team access</h2></header>
              <div className="cside__body"><AdminLevelSelect userId={p.id} level={p.admin_level ?? "staff"} /></div>
            </section>
          )}
          {owner && !self && (
            <section className="panel cside cside--danger">
              <header className="panel__head"><h2>Delete account</h2></header>
              <div className="cside__body"><DeleteAccountBox userId={p.id} what={what} /></div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
