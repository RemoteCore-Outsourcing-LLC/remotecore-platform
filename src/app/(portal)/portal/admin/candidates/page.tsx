import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin, LISTING_STATUS } from "@/lib/portal/admin";
import { money, ago } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";
import { listingCode } from "@/lib/marketplace";

export const metadata: Metadata = { title: "Candidates", robots: { index: false } };

type Search = { q?: string; skill?: string; country?: string; tag?: string; min_years?: string; max_pay?: string; listing?: string; files?: string };
type Row = {
  id: string; name: string; email: string; country: string | null; created_at: string; status: string;
  headline: string | null; years: number | null; pay: number | null; currency: string; listing: string;
  resume: boolean; audio: boolean; skills: string[]; tags: string[];
};

// The whole candidate pool in one list. Filters run on the server; the pool is small enough to filter in memory.
export default async function AdminCandidates({ searchParams }: { searchParams: Promise<Search> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const [people, details, skillRows, tagRows] = await Promise.all([
    sb.from("profiles").select("id, full_name, email, country, created_at, status").eq("role", "job_seeker").order("created_at", { ascending: false }).limit(2000),
    sb.from("seeker_profiles").select("user_id, headline, years_experience, expected_salary, salary_currency, marketplace_status, resume_path, audio_path"),
    sb.from("seeker_skills").select("user_id, skill"),
    sb.from("candidate_tags").select("seeker_id, tag"),
  ]);
  const det = new Map((details.data ?? []).map((d) => [d.user_id as string, d]));
  const group = (rows: { k: string; v: string }[]) => rows.reduce((m, r) => m.set(r.k, [...(m.get(r.k) ?? []), r.v]), new Map<string, string[]>());
  const skills = group((skillRows.data ?? []).map((r) => ({ k: r.user_id as string, v: r.skill as string })));
  const tags = group((tagRows.data ?? []).map((r) => ({ k: r.seeker_id as string, v: r.tag as string })));

  const all: Row[] = (people.data ?? []).map((p) => {
    const d = det.get(p.id);
    return {
      id: p.id, name: p.full_name || p.email, email: p.email, country: p.country, created_at: p.created_at, status: p.status,
      headline: d?.headline ?? null, years: d?.years_experience ?? null, pay: d?.expected_salary != null ? Number(d.expected_salary) : null,
      currency: d?.salary_currency || "USD", listing: d?.marketplace_status ?? "hidden", resume: !!d?.resume_path, audio: !!d?.audio_path,
      skills: skills.get(p.id) ?? [], tags: tags.get(p.id) ?? [],
    };
  });

  const q = (sp.q ?? "").trim().toLowerCase().slice(0, 80);
  const skill = (sp.skill ?? "").trim().toLowerCase();
  const minYears = sp.min_years ? Number(sp.min_years) : null;
  const maxPay = sp.max_pay ? Number(sp.max_pay) : null;
  const shown = all.filter((r) => {
    if (q && ![r.name, r.email, r.headline ?? "", listingCode(r.id), ...r.skills, ...r.tags].join(" ").toLowerCase().includes(q)) return false;
    if (skill && !r.skills.some((s) => s.toLowerCase() === skill)) return false;
    if (sp.country && r.country !== sp.country) return false;
    if (sp.tag && !r.tags.includes(sp.tag)) return false;
    if (minYears != null && Number.isFinite(minYears) && (r.years ?? -1) < minYears) return false;
    if (maxPay != null && Number.isFinite(maxPay) && (r.pay == null || r.pay > maxPay)) return false;
    if (sp.listing && r.listing !== sp.listing) return false;
    if (sp.files === "both" && !(r.resume && r.audio)) return false;
    return true;
  });

  const uniq = (xs: string[]) => Array.from(new Set(xs.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  const countries = uniq(all.map((r) => r.country ?? ""));
  const allSkills = uniq(all.flatMap((r) => r.skills));
  const allTags = uniq(all.flatMap((r) => r.tags));
  const wants = all.filter((r) => r.listing === "pending").length;
  const filtered = Object.values(sp).some(Boolean);

  return (
    <div className="pwrap">
      <PageHead title="Candidates" sub="Every job seeker with their skills, experience, pay and files. Filter the pool to find people for a role." />
      {wants > 0 && sp.listing !== "pending" && <p className="notice" role="status">{wants} {wants === 1 ? "candidate wants" : "candidates want"} to be listed on the Talent Marketplace. <a href="/portal/admin/candidates?listing=pending">Review them</a>.</p>}
      <form className="afilter" action="/portal/admin/candidates" role="search">
        <label className="field afilter__q"><span>Search</span><input name="q" defaultValue={sp.q} placeholder="Name, email, skill, tag or card number (RC-...)" /></label>
        <label className="field"><span>Skill</span>
          <select name="skill" defaultValue={sp.skill ?? ""}><option value="">Any skill</option>{allSkills.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}</select>
        </label>
        <label className="field"><span>Country</span>
          <select name="country" defaultValue={sp.country ?? ""}><option value="">Any country</option>{countries.map((c) => <option key={c}>{c}</option>)}</select>
        </label>
        <label className="field"><span>Tag</span>
          <select name="tag" defaultValue={sp.tag ?? ""}><option value="">Any tag</option>{allTags.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="field"><span>Experience</span>
          <select name="min_years" defaultValue={sp.min_years ?? ""}><option value="">Any</option>{[1, 2, 3, 5, 10].map((n) => <option key={n} value={n}>{n}+ years</option>)}</select>
        </label>
        <label className="field"><span>Max pay a month</span><input name="max_pay" type="number" min="0" inputMode="numeric" defaultValue={sp.max_pay} /></label>
        <label className="field"><span>Marketplace</span>
          <select name="listing" defaultValue={sp.listing ?? ""}><option value="">Any</option>{Object.entries(LISTING_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}</select>
        </label>
        <label className="field"><span>Files</span>
          <select name="files" defaultValue={sp.files ?? ""}><option value="">Any</option><option value="both">Resume and voice intro</option></select>
        </label>
        <div className="afilter__go">
          <button className="btn btn--main btn--sm">Filter</button>
          {filtered && <a className="btn btn--ghost btn--sm" href="/portal/admin/candidates">Clear</a>}
        </div>
      </form>
      <p className="soft small afilter__count">{shown.length} of {all.length} {all.length === 1 ? "candidate" : "candidates"}</p>
      <section className="panel" aria-label="Candidates">
        {shown.length === 0 ? (
          <Empty title={all.length ? "Nobody matches" : "No job seekers yet"}>{all.length ? <>Try fewer filters. <a href="/portal/admin/candidates">Clear all</a>.</> : "Job seekers show up here as soon as they sign up."}</Empty>
        ) : (
          <ul className="rows crows">
            {shown.map((r) => {
              const l = LISTING_STATUS[r.listing];
              return (
                <li key={r.id}>
                  <div className="crows__who">
                    <a className="rows__title" href={`/portal/admin/candidates/${r.id}`}>{r.name}</a>
                    <span className="soft small">{[r.headline, r.country, r.years != null ? `${r.years} ${r.years === 1 ? "year" : "years"}` : null, r.pay ? `${money(r.pay, r.currency)} a month` : null].filter(Boolean).join(" · ") || r.email}</span>
                    {(r.skills.length > 0 || r.tags.length > 0) && <span className="crows__skills small">{[...r.tags.map((t) => `#${t}`), ...r.skills.slice(0, 4)].join(" · ")}</span>}
                  </div>
                  <div className="crows__job">
                    <span className="small">{r.resume ? "Resume" : "No resume"} · {r.audio ? "Voice intro" : "No voice"}</span>
                    <span className="soft small">Joined {ago(r.created_at)}</span>
                  </div>
                  <span className="apills">
                    {r.status !== "active" && <span className="pill pill--bad">{r.status === "suspended" ? "Suspended" : "Deactivated"}</span>}
                    {r.listing !== "hidden" && <span className={`pill pill--${l.tone}`}>{l.label}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
