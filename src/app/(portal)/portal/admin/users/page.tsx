import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin, ACCOUNT_STATUS, LEVEL_LABEL } from "@/lib/portal/admin";
import { COMPANY_STATUS } from "@/lib/employer";
import { ago } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";
import { AddTeamMemberForm } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Users", robots: { index: false } };

type Search = { tab?: string; q?: string; status?: string; deleted?: string };
type Row = { id: string; full_name: string; email: string; country: string | null; status: string; created_at: string; admin_level: string | null };
type CompanyRow = { id: string; owner_id: string; name: string; contact_person: string; status: string; industry: string | null };

const TABS = [["job_seeker", "Job seekers"], ["employer", "Employers"], ["admin", "Team"]] as const;

export default async function Users({ searchParams }: { searchParams: Promise<Search> }) {
  const { sb, admin, owner } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "job_seeker";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const status = ["active", "suspended", "deactivated", "pending"].includes(sp.status ?? "") ? sp.status! : "";

  const head = { count: "exact" as const, head: true };
  const [seekers, employers, team, pendingCo] = await Promise.all([
    sb.from("profiles").select("id", head).eq("role", "job_seeker"),
    sb.from("profiles").select("id", head).eq("role", "employer"),
    sb.from("profiles").select("id", head).eq("role", "admin"),
    sb.from("companies").select("id", head).eq("status", "pending"),
  ]);
  const counts: Record<string, number> = { job_seeker: seekers.count ?? 0, employer: employers.count ?? 0, admin: team.count ?? 0 };

  let query = sb.from("profiles").select("id, full_name, email, country, status, created_at, admin_level").eq("role", tab).order("created_at", { ascending: false }).limit(300);
  if (q) {
    const safe = q.replace(/[%,()*\\]/g, " ");
    query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`);
  }
  if (status && status !== "pending") query = query.eq("status", status);
  const { data } = await query;
  let rows = (data ?? []) as Row[];

  let companies = new Map<string, CompanyRow>();
  if (tab === "employer") {
    const { data: cs } = await sb.from("companies").select("id, owner_id, name, contact_person, status, industry");
    companies = new Map(((cs ?? []) as CompanyRow[]).map((c) => [c.owner_id, c]));
    if (q) {
      const ql = q.toLowerCase();
      const byCompany = ((cs ?? []) as CompanyRow[]).filter((c) => c.name.toLowerCase().includes(ql)).map((c) => c.owner_id);
      if (byCompany.length) {
        const { data: more } = await sb.from("profiles").select("id, full_name, email, country, status, created_at, admin_level").in("id", byCompany);
        const seen = new Set(rows.map((r) => r.id));
        rows = [...rows, ...((more ?? []) as Row[]).filter((r) => !seen.has(r.id))];
      }
    }
    if (status === "pending") rows = rows.filter((r) => companies.get(r.id)?.status === "pending");
    // Companies waiting for approval first.
    rows.sort((a, b) => Number(companies.get(b.id)?.status === "pending") - Number(companies.get(a.id)?.status === "pending"));
  }

  const link = (t: string, s = "") => {
    const p = new URLSearchParams({ tab: t });
    if (q && t === tab) p.set("q", q);
    if (s) p.set("status", s);
    return `/portal/admin/users?${p}`;
  };

  return (
    <div className="pwrap">
      <PageHead title="Users" sub="Every job seeker, employer and team member. Open an account to approve, suspend or close it." />
      {sp.deleted && <p className="notice" role="status">The account was deleted.</p>}
      <nav className="seg seg--tabs" aria-label="Account type">
        {TABS.map(([k, label]) => <a key={k} href={link(k)} aria-current={tab === k ? "page" : undefined}>{label} <b>{counts[k]}</b></a>)}
      </nav>

      <div className="cfilter">
        <form className="cfilter__job" action="/portal/admin/users" role="search">
          <input type="hidden" name="tab" value={tab} />
          <label className="field"><span>Search</span><input name="q" defaultValue={q} placeholder={tab === "employer" ? "Name, email or company" : "Name or email"} /></label>
          <label className="field"><span>Status</span>
            <select name="status" defaultValue={status}>
              <option value="">Any status</option>
              {tab === "employer" && <option value="pending">Company waiting for approval</option>}
              {Object.entries(ACCOUNT_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </label>
          <button className="btn btn--ghost btn--sm">Search</button>
        </form>
        {tab === "employer" && (pendingCo.count ?? 0) > 0 && status !== "pending" && (
          <a className="btn btn--soft btn--sm" href={link("employer", "pending")}>{pendingCo.count} waiting for approval</a>
        )}
      </div>

      <section className="panel" aria-label={TABS.find(([k]) => k === tab)?.[1]}>
        {rows.length === 0 ? (
          <Empty title="No accounts found">{q || status ? <>Try a different search. <a href={link(tab)}>Clear the search</a>.</> : "New accounts show up here."}</Empty>
        ) : (
          <ul className="rows crows">
            {rows.map((r) => {
              const s = ACCOUNT_STATUS[r.status];
              const c = companies.get(r.id);
              const cs = c ? COMPANY_STATUS[c.status] : null;
              return (
                <li key={r.id}>
                  <div className="crows__who">
                    <a className="rows__title" href={`/portal/admin/users/${r.id}`}>{tab === "employer" && c ? c.name : r.full_name || r.email}</a>
                    <span className="soft small">{[tab === "employer" ? c?.contact_person || r.full_name : null, r.email, tab !== "employer" ? r.country : c?.industry].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="crows__job"><span className="soft small">Joined {ago(r.created_at)}</span>{r.admin_level && <span className="small">{LEVEL_LABEL[r.admin_level]}</span>}</div>
                  <span className="apills">
                    {cs && c?.status !== "approved" && <span className={`pill pill--${cs.tone}`}>{cs.label}</span>}
                    {(r.status !== "active" || !cs || c?.status === "approved") && <span className={`pill pill--${s?.tone ?? "neutral"}`}>{s?.label ?? r.status}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {tab === "admin" && (
        <section className="panel" aria-labelledby="add-h" style={{ marginTop: 20 }}>
          <header className="panel__head"><h2 id="add-h">Add a team member</h2></header>
          <div className="epanel__body">
            {owner ? <AddTeamMemberForm /> : <p className="soft">Only an owner can add team members.</p>}
          </div>
        </section>
      )}
    </div>
  );
}
