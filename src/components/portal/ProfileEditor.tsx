"use client";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, saveDraft, type SaveResult, type SaveAllResult } from "@/app/(portal)/portal/profile/actions";
import { COUNTRIES, CURRENCIES, countryByName } from "@/lib/geo";
import { ARRANGEMENTS, LEVELS, type SectionKey } from "@/lib/portal/schema";

type Row = Record<string, string>;
export type ProfileData = {
  about: { full_name: string; dial: string; phone: string; country: string; headline: string; summary: string };
  work_prefs: { expected_salary: string; salary_currency: string; employment_types: string[]; preferred_categories: string[]; available_from: string; preferred_hours: string; time_zone: string; years_experience: string };
  work: Row[]; education: Row[];
  certs: { qualifications: string; items: Row[] };
  skills: { skills: string; languages: Row[] };
};
type Key = Exclude<SectionKey, "computer">;

const NAV: [Key | "media", string][] = [
  ["about", "About you"], ["media", "Photo, resume and voice"], ["work_prefs", "Pay and availability"],
  ["work", "Work history"], ["education", "Education"], ["certs", "Qualifications"], ["skills", "Skills and languages"],
];
const LOCAL = "rc-profile-draft";

function Section({ id, title, intro, done, children, status }: {
  id: string; title: string; intro?: string; done: boolean; children: ReactNode; status?: SaveResult;
}) {
  return (
    <section className="psec" id={id} aria-labelledby={`${id}-h`}>
      <header className="psec__head">
        <h2 id={`${id}-h`}>{title}</h2>
        <span className={`pill ${done ? "pill--ok" : ""}`}>{done ? "Complete" : "To do"}</span>
      </header>
      {intro && <p className="psec__intro">{intro}</p>}
      <div className="psec__body">{children}</div>
      {status && !status.ok && <footer className="psec__foot"><span className="ferr" role="alert">{status.message}</span></footer>}
    </section>
  );
}

const F = ({ label, error, children, wide, hint }: { label: string; error?: string; children: ReactNode; wide?: boolean; hint?: string }) => (
  <label className={`field ${wide ? "field--wide" : ""}`}><span>{label}</span>{children}{hint && <em className="hint">{hint}</em>}{error && <span className="ferr">{error}</span>}</label>
);

function ListEditor({ rows, setRows, blank, render, addLabel, err }: {
  rows: Row[]; setRows: (r: Row[]) => void; blank: Row; addLabel: string; err: (k: string) => string | undefined;
  render: (r: Row, set: (k: string, v: string) => void, i: number) => ReactNode;
}) {
  return (
    <div className="plist">
      {rows.length === 0 && <p className="soft">Nothing added yet.</p>}
      {rows.map((r, i) => (
        <div className="plist__row" key={i}>
          <div className="pgrid">{render(r, (k, v) => setRows(rows.map((x, j) => (j === i ? { ...x, [k]: v } : x))), i)}</div>
          <button type="button" className="linkbtn" onClick={() => setRows(rows.filter((_, j) => j !== i))}>Remove</button>
          {Object.keys(blank).some((k) => err(`${i}.${k}`)) && <span className="ferr">Check this entry.</span>}
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setRows([...rows, { ...blank }])}>{addLabel}</button>
    </div>
  );
}

export type ProfileDraft = { about: ProfileData["about"]; prefs: ProfileData["work_prefs"]; work: Row[]; edu: Row[]; certs: ProfileData["certs"]; sk: ProfileData["skills"] };

export function ProfileEditor({ initial, saved, draftAt, savedAt, submitted, categories, email, media, mediaDone }: {
  initial: ProfileData; saved: ProfileData; draftAt: string | null; savedAt: string | null; submitted: boolean;
  categories: string[]; email: string; media: ReactNode; mediaDone: boolean;
}) {
  const router = useRouter();
  const [about, setAbout] = useState(initial.about);
  const [prefs, setPrefs] = useState(initial.work_prefs);
  const [work, setWork] = useState(initial.work);
  const [edu, setEdu] = useState(initial.education);
  const [certs, setCerts] = useState(initial.certs);
  const [sk, setSk] = useState(initial.skills);
  const [res, setRes] = useState<SaveAllResult | null>(null);
  const [pending, start] = useTransition();
  const [draftNote, setDraftNote] = useState<string | null>(draftAt ? "We brought back the changes you had not submitted yet." : null);
  const zones = useMemo(() => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]), []);
  const dials = useMemo(() => Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), []);
  const err = (k: Key) => (f: string) => { const r = res?.results[k]; return r && !r.ok ? r.errors[f] : undefined; };
  const e = { about: err("about"), work_prefs: err("work_prefs"), work: err("work"), education: err("education"), certs: err("certs"), skills: err("skills") };

  // Restore a newer copy kept in this browser (for example after the connection dropped).
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return; restored.current = true;
    try {
      const raw = localStorage.getItem(LOCAL); if (!raw) return;
      const d = JSON.parse(raw) as ProfileDraft & { at: string };
      const newest = [draftAt, savedAt].filter(Boolean).sort().pop() ?? "";
      if (!d.at || d.at <= newest) { localStorage.removeItem(LOCAL); return; }
      setAbout(d.about); setPrefs(d.prefs); setWork(d.work); setEdu(d.edu); setCerts(d.certs); setSk(d.sk);
      setDraftNote("We brought back the changes you had not submitted yet.");
    } catch {}
  }, [draftAt, savedAt]);

  // Autosave: two seconds after the last change, keep a draft in this browser and on our server.
  const draft = useMemo<ProfileDraft>(() => ({ about, prefs, work, edu, certs, sk }), [about, prefs, work, edu, certs, sk]);
  const first = useRef(true);
  const [autosaved, setAutosaved] = useState<string | null>(null);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { localStorage.setItem(LOCAL, JSON.stringify({ ...draft, at: new Date().toISOString() })); } catch {}
    const t = setTimeout(() => { saveDraft(draft).then((r) => { if (r.ok) setAutosaved(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })); }).catch(() => {}); }, 2000);
    return () => clearTimeout(t);
  }, [draft]);

  const submit = useCallback(() => start(async () => {
    const r = await saveProfile({
      about: { full_name: about.full_name, phone: `${about.dial} ${about.phone.replace(/[^\d]/g, "")}`, country: about.country, headline: about.headline, summary: about.summary },
      work_prefs: prefs, work, education: edu, certs,
      skills: { skills: sk.skills.split(",").map((x) => x.trim()).filter(Boolean), languages: sk.languages },
    });
    setRes(r);
    if (r.ok) { try { localStorage.removeItem(LOCAL); } catch {} setDraftNote(null); }
    router.refresh();
    const bad = NAV.find(([k]) => k !== "media" && r.results[k as Key] && !r.results[k as Key]!.ok);
    if (bad) document.getElementById(bad[0])?.scrollIntoView({ behavior: "smooth", block: "start" });
  }), [about, prefs, work, edu, certs, sk, router]);

  const done: Record<Key | "media", boolean> = {
    media: mediaDone,
    about: !!(saved.about.full_name && saved.about.phone && saved.about.country),
    work_prefs: !!(saved.work_prefs.expected_salary && saved.work_prefs.employment_types.length && saved.work_prefs.time_zone),
    work: saved.work.length > 0, education: saved.education.length > 0,
    certs: !!(saved.certs.qualifications || saved.certs.items.length),
    skills: saved.skills.languages.length > 0 && !!saved.skills.skills,
  };
  const count = Object.values(done).filter(Boolean).length;
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const isSubmitted = submitted || !!res?.submitted;

  return (
    <div className="pedit">
      <aside className="pedit__nav" aria-label="Profile sections">
        <p className="pedit__count"><b>{count} of {NAV.length}</b> sections complete</p>
        {isSubmitted && <p className="small soft">Application submitted.</p>}
        <div className="meter" aria-hidden="true"><i style={{ width: `${(count / NAV.length) * 100}%` }} /></div>
        <nav>{NAV.map(([k, label]) => <a key={k} href={`#${k}`} className={done[k] ? "is-done" : ""}>{label}</a>)}</nav>
        {count === NAV.length && (
          <div className="pdone" role="status">
            <b>Your profile is complete</b>
            <span>You are ready to apply.</span>
            <a className="btn btn--main btn--sm" href="/portal/jobs">Browse jobs</a>
          </div>
        )}
      </aside>

      <div className="pedit__main">
        <AutofillNotice />
        {draftNote && <p className="notice" role="status">{draftNote} Press <b>{isSubmitted ? "Save changes" : "Submit application"}</b> at the bottom when you are ready.</p>}
        <Section id="about" title="About you" done={done.about} status={res?.results.about}>
          <div className="pgrid">
            <F label="Full name" error={e.about("full_name")}><input value={about.full_name} onChange={(e) => setAbout({ ...about, full_name: e.target.value })} autoComplete="name" /></F>
            <F label="Email"><input value={email} disabled /></F>
            <F label="Country of residence" error={e.about("country")}>
              <select value={about.country} onChange={(e) => { const c = countryByName(e.target.value); setAbout({ ...about, country: e.target.value, dial: c?.dial || about.dial }); }}>
                <option value="" disabled>Choose your country</option>{COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}
              </select>
            </F>
            <F label="Mobile number" error={e.about("phone")}>
              <span className="combo"><select aria-label="Dial code" value={about.dial} onChange={(e) => setAbout({ ...about, dial: e.target.value })}>{dials.map((d) => <option key={d}>{d}</option>)}</select>
                <input type="tel" inputMode="tel" value={about.phone} onChange={(e) => setAbout({ ...about, phone: e.target.value })} /></span>
            </F>
            <F label="Professional headline" wide hint="For example: Medical receptionist with 5 years in US clinics"><input value={about.headline} maxLength={120} onChange={(e) => setAbout({ ...about, headline: e.target.value })} /></F>
            <F label="Professional summary" wide><textarea rows={4} maxLength={2000} value={about.summary} onChange={(e) => setAbout({ ...about, summary: e.target.value })} /></F>
          </div>
        </Section>

        {media}

        <Section id="work_prefs" title="Pay and availability" done={done.work_prefs} status={res?.results.work_prefs}>
          <div className="pgrid">
            <F label="Expected monthly pay" error={e.work_prefs("expected_salary")}>
              <span className="combo"><select aria-label="Currency" value={prefs.salary_currency} onChange={(e) => setPrefs({ ...prefs, salary_currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
                <input type="number" min="1" inputMode="numeric" value={prefs.expected_salary} onChange={(e) => setPrefs({ ...prefs, expected_salary: e.target.value })} /></span>
            </F>
            <F label="Years of experience"><input type="number" min="0" max="60" value={prefs.years_experience} onChange={(e) => setPrefs({ ...prefs, years_experience: e.target.value })} /></F>
            <F label="Available to start"><input type="date" value={prefs.available_from} onChange={(e) => setPrefs({ ...prefs, available_from: e.target.value })} /></F>
            <F label="Your time zone" error={e.work_prefs("time_zone")}>
              <select value={prefs.time_zone} onChange={(e) => setPrefs({ ...prefs, time_zone: e.target.value })}><option value="" disabled>Choose your time zone</option>{zones.map((z) => <option key={z}>{z}</option>)}</select>
            </F>
            <F label="Preferred working hours" wide hint="For example: 8am to 5pm US Eastern, Monday to Friday"><input value={prefs.preferred_hours} maxLength={120} onChange={(e) => setPrefs({ ...prefs, preferred_hours: e.target.value })} /></F>
            <fieldset className="field field--wide"><legend>Work arrangement</legend>
              <div className="chips">{ARRANGEMENTS.map((a) => <label key={a} className="chip-check"><input type="checkbox" checked={prefs.employment_types.includes(a)} onChange={() => setPrefs({ ...prefs, employment_types: toggle(prefs.employment_types, a) })} />{a}</label>)}</div>
              {e.work_prefs("employment_types") && <span className="ferr">{e.work_prefs("employment_types")}</span>}
            </fieldset>
            <fieldset className="field field--wide"><legend>Job categories you want</legend>
              <div className="chips">{categories.map((c) => <label key={c} className="chip-check"><input type="checkbox" checked={prefs.preferred_categories.includes(c)} onChange={() => setPrefs({ ...prefs, preferred_categories: toggle(prefs.preferred_categories, c) })} />{c}</label>)}</div>
              {e.work_prefs("preferred_categories") && <span className="ferr">{e.work_prefs("preferred_categories")}</span>}
            </fieldset>
          </div>
        </Section>

        <Section id="work" title="Work history" done={done.work} status={res?.results.work}>
          <ListEditor rows={work} setRows={setWork} err={e.work} addLabel="Add a job" blank={{ company: "", title: "", start_date: "", end_date: "", description: "" }}
            render={(r, set) => <>
              <F label="Job title"><input value={r.title} onChange={(e) => set("title", e.target.value)} /></F>
              <F label="Company"><input value={r.company} onChange={(e) => set("company", e.target.value)} /></F>
              <F label="Start date"><input type="date" value={r.start_date} onChange={(e) => set("start_date", e.target.value)} /></F>
              <F label="End date" hint="Leave empty if you still work there"><input type="date" value={r.end_date} onChange={(e) => set("end_date", e.target.value)} /></F>
              <F label="What you did" wide><textarea rows={3} maxLength={2000} value={r.description} onChange={(e) => set("description", e.target.value)} /></F>
            </>} />
        </Section>

        <Section id="education" title="Education" done={done.education} status={res?.results.education}>
          <ListEditor rows={edu} setRows={setEdu} err={e.education} addLabel="Add education" blank={{ school: "", degree: "", field: "", start_year: "", end_year: "" }}
            render={(r, set) => <>
              <F label="School or university"><input value={r.school} onChange={(e) => set("school", e.target.value)} /></F>
              <F label="Degree or diploma"><input value={r.degree} onChange={(e) => set("degree", e.target.value)} /></F>
              <F label="Field of study"><input value={r.field} onChange={(e) => set("field", e.target.value)} /></F>
              <div className="pgrid pgrid--2">
                <F label="Start year"><input type="number" min="1950" max="2100" value={r.start_year} onChange={(e) => set("start_year", e.target.value)} /></F>
                <F label="End year"><input type="number" min="1950" max="2100" value={r.end_year} onChange={(e) => set("end_year", e.target.value)} /></F>
              </div>
            </>} />
        </Section>

        <Section id="certs" title="Qualifications" done={done.certs} status={res?.results.certs}>
          <F label="Professional qualifications" wide hint="Anything that makes you right for remote work: tools you know well, industries, achievements."><textarea rows={3} maxLength={2000} value={certs.qualifications} onChange={(e) => setCerts({ ...certs, qualifications: e.target.value })} /></F>
          <h3 className="psub">Certifications and licenses</h3>
          <ListEditor rows={certs.items} setRows={(items) => setCerts({ ...certs, items })} err={(k) => e.certs(`items.${k}`)} addLabel="Add a certificate" blank={{ name: "", issuer: "", year: "" }}
            render={(r, set) => <>
              <F label="Name"><input value={r.name} onChange={(e) => set("name", e.target.value)} /></F>
              <F label="Issued by"><input value={r.issuer} onChange={(e) => set("issuer", e.target.value)} /></F>
              <F label="Year"><input type="number" min="1950" max="2100" value={r.year} onChange={(e) => set("year", e.target.value)} /></F>
            </>} />
        </Section>

        <Section id="skills" title="Skills and languages" done={done.skills} status={res?.results.skills}>
          <F label="Skills and software" wide hint="Separate with commas. For example: Zendesk, Excel, insurance verification" error={e.skills("skills")}><input value={sk.skills} onChange={(e) => setSk({ ...sk, skills: e.target.value })} /></F>
          <h3 className="psub">Languages</h3>
          {e.skills("languages") && <span className="ferr">{e.skills("languages")}</span>}
          <ListEditor rows={sk.languages} setRows={(languages) => setSk({ ...sk, languages })} err={(k) => e.skills(`languages.${k}`)} addLabel="Add a language" blank={{ language: "", level: "Fluent" }}
            render={(r, set) => <>
              <F label="Language"><input value={r.language} onChange={(e) => set("language", e.target.value)} /></F>
              <F label="Level"><select value={r.level} onChange={(e) => set("level", e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></F>
            </>} />
        </Section>

        <div className="psave" role="region" aria-label="Save your application">
          <div className="psave__msg" aria-live="polite">
            {res && !res.ok && <span className="ferr">{res.message}</span>}
            {res?.ok && res.submitted && <span className="saved">Thank you. Your application is submitted and we emailed you a confirmation.</span>}
            {res?.ok && !res.submitted && res.missing.length > 0 && <span className="soft">Saved. To submit, finish: {res.missing.join(", ")}.</span>}
            {res?.ok && !res.submitted && res.missing.length === 0 && <span className="saved">All changes saved.</span>}
            {!res && autosaved && <span className="soft small">Draft kept automatically at {autosaved}.</span>}
            {!res && !autosaved && <span className="soft small">Your answers are kept automatically as you type.</span>}
          </div>
          <button type="button" className="btn btn--main" onClick={submit} disabled={pending}>
            {pending ? "Saving..." : isSubmitted ? "Save changes" : "Submit application"}
          </button>
        </div>
      </div>
    </div>
  );
}

// After a resume upload fills the empty parts, the page reloads and says which parts to check.
function AutofillNotice() {
  const [parts, setParts] = useState<string | null>(null);
  const ref = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (parts) ref.current?.scrollIntoView({ block: "center" }); }, [parts]);
  useEffect(() => {
    try { const v = sessionStorage.getItem("rc-autofill"); if (v) { setParts(v); sessionStorage.removeItem("rc-autofill"); } } catch {}
  }, []);
  if (!parts) return null;
  return <p ref={ref} className="notice notice--ok" role="status">We filled these parts from your resume: {parts}. Please check each one, fix anything that is wrong, and add what is missing.</p>;
}
