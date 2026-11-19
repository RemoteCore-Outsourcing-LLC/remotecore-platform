"use client";
import { useMemo, useState } from "react";

export type Profile = { id: string; role: string; name: string; specialty: string; summary: string; years: string; skills: string[]; availability: string; zone: string; languages: string[] };

// Our core talent regions are always in the Time Zone filter, in this order, even before a profile uses them.
export const REGIONS = ["Caribbean", "Americas / Latin America", "Asia Pacific / Philippines", "Africa / Europe", "Flexible"];
const zones = (list: Profile[]) => [...REGIONS.slice(0, 3), ...REGIONS.slice(3).filter((z) => list.some((p) => p.zone === z)), ...opts(list, "zone").filter((z) => !REGIONS.includes(z))];

const opts = (list: Profile[], k: keyof Profile) => Array.from(new Set(list.flatMap((p) => (Array.isArray(p[k]) ? (p[k] as string[]) : [p[k] as string])))).sort();

export function Marketplace({ profiles, sample = false }: { profiles: Profile[]; sample?: boolean }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  // Adds the profile ID to the form below (several are fine), then scrolls to the form.
  const pick = (id: string) => {
    const el = document.querySelector<HTMLInputElement>('input[name="profile_ids"]');
    if (el) {
      const ids = el.value.split(",").map((x) => x.trim()).filter(Boolean);
      if (!ids.includes(id)) el.value = [...ids, id].join(", ");
    }
    setPicked((p) => (p.includes(id) ? p : [...p, id]));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("introduction")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    el?.focus({ preventScroll: true });
  };
  const [f, setF] = useState({ specialty: "", years: "", availability: "", zone: "", language: "" });
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return profiles.filter((p) => {
      const hay = [p.role, p.specialty, p.summary, ...p.skills].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w))
        && (!f.specialty || p.specialty === f.specialty)
        && (!f.years || p.years === f.years)
        && (!f.availability || p.availability === f.availability)
        && (!f.zone || p.zone === f.zone)
        && (!f.language || p.languages.includes(f.language));
    });
  }, [q, f, profiles]);

  const sel = (label: string, key: keyof typeof f, values: string[]) => (
    <label className="field">
      <span>{label}</span>
      <select value={f[key]} onChange={(e) => setF({ ...f, [key]: e.target.value })}>
        <option value="">Any</option>
        {values.map((v) => <option key={v}>{v}</option>)}
      </select>
    </label>
  );

  return (
    <>
      <div className="panel" style={{ display: "grid", gap: 14 }}>
        <label className="field">
          <span>Search</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by role, skill, or experience" />
        </label>
        <div className="mk-filters">
          {sel("Specialty", "specialty", opts(profiles, "specialty"))}
          {sel("Years of Experience", "years", opts(profiles, "years"))}
          {sel("Availability", "availability", opts(profiles, "availability"))}
          {sel("Time Zone / Region", "zone", zones(profiles))}
          {sel("Language", "language", opts(profiles, "languages"))}
        </div>
      </div>

      <div className="head" style={{ marginTop: 40, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "end", gap: 16, flexWrap: "wrap", maxWidth: "none" }}>
        <h2>Explore Our Talent Network</h2>
        <span className="soft" aria-live="polite">{shown.length} {sample ? "sample " : ""}{shown.length === 1 ? "profile" : "profiles"}</span>
      </div>
      {sample && <p className="mk-sample" role="note"><b>Sample profiles.</b> These examples show how the marketplace works. They are not real candidates and are not available for hire.</p>}

      {shown.length === 0 ? (
        <div className="card" style={{ alignItems: "start" }}>
          <p>No profiles match your search right now. Tell us what you need and we can help source a suitable candidate.</p>
          <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
        </div>
      ) : (
        <div className="cards">
          {shown.map((p) => (
            <article key={p.id} className="card mk-card">
              <span className="mk-id">ID: {p.id}</span>
              <h3>{p.role}</h3>
              <p style={{ color: "var(--sc-ink)", fontWeight: 600, fontSize: 15 }}>{p.name}</p>
              <p>{p.summary}</p>
              <div className="tags">{p.skills.map((s) => <span key={s} className="tag">{s}</span>)}</div>
              <p className="note soft">{p.years} · {p.availability} · {p.zone}</p>
              <a className="btn btn--ghost btn--sm" href="#introduction" onClick={(e) => { e.preventDefault(); pick(p.id); }}>
                {picked.includes(p.id) ? "Added to Your Request ✓" : "Request an Introduction"}
              </a>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
