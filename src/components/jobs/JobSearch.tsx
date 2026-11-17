import type { ReactNode } from "react";
import { COUNTRIES } from "@/lib/geo";
import { TYPES, LEVELS, REMOTE, PAY, activeCount, filterUrl, type Filters } from "@/lib/jobs/search";
import "./jobsearch.css";

const Sel = ({ label, name, value, options, any }: { label: string; name: string; value: string; options: [string, string][]; any: string }) => (
  <label className="js-field">
    <span>{label}</span>
    <select name={name} defaultValue={value}>
      <option value="">{any}</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);

// A plain GET form: works without JavaScript, and every search has its own shareable link.
export function JobSearch({ base, f, cats, anchor = "" }: { base: string; f: Filters; cats: { id: number; name: string }[]; anchor?: string }) {
  const n = activeCount(f);
  return (
    <form className="js" action={`${base}${anchor}`} method="get" role="search" aria-label="Search jobs">
      <div className="js-bar">
        <label className="js-q">
          <span className="js-sr">Keywords</span>
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <input type="search" name="q" defaultValue={f.q} placeholder="Title, skill or industry" autoComplete="off" enterKeyHint="search" />
        </label>
        <button className="js-go" type="submit">Search</button>
      </div>
      <details className="js-more" open={n > 0 ? true : undefined}>
        <summary>Filters{n > 0 ? ` (${n})` : ""}</summary>
        <div className="js-grid">
          <Sel label="Industry" name="category" value={f.category} any="All industries" options={cats.map((c) => [String(c.id), c.name])} />
          <Sel label="Job type" name="type" value={f.type} any="Any type" options={TYPES} />
          <Sel label="Experience" name="level" value={f.level} any="Any level" options={LEVELS} />
          <Sel label="Remote" name="remote" value={f.remote} any="Any remote job" options={REMOTE} />
          <Sel label="I live in" name="country" value={f.country} any="Any country" options={COUNTRIES.map((c) => [c.name, c.name])} />
          <Sel label="Pay" name="pay" value={f.pay} any="Any pay" options={PAY} />
        </div>
        <div className="js-foot">
          {(n > 0 || f.q) && <a href={`${base}${anchor}`}>Clear all</a>}
          <button className="js-go js-go--sm" type="submit">Show jobs</button>
        </div>
      </details>
    </form>
  );
}

export function ResultsHead({ total, f, children }: { total: number; f: Filters; children?: ReactNode }) {
  const what = f.q ? <> for <b>&ldquo;{f.q}&rdquo;</b></> : null;
  return (
    <div className="js-count" role="status">
      <p><b>{total}</b> open {total === 1 ? "job" : "jobs"}{what}</p>
      {children}
    </div>
  );
}

export function Pager({ base, f, total, per, anchor = "" }: { base: string; f: Filters; total: number; per: number; anchor?: string }) {
  const pages = Math.ceil(total / per);
  if (pages <= 1) return null;
  return (
    <nav className="js-pager" aria-label="Pages">
      {f.page > 1 ? <a href={filterUrl(base, f, { page: f.page - 1 }) + anchor}>Previous</a> : <span />}
      <span>Page {f.page} of {pages}</span>
      {f.page < pages ? <a href={filterUrl(base, f, { page: f.page + 1 }) + anchor}>Next</a> : <span />}
    </nav>
  );
}
