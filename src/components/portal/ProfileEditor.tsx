"use client";
import { useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { saveSection, type SaveResult } from "@/app/(portal)/portal/profile/actions";
import { COUNTRIES, CURRENCIES, countryByName } from "@/lib/geo";
import { ARRANGEMENTS, LEVELS, type SectionKey } from "@/lib/portal/schema";

type Row = Record<string, string>;
export type ProfileData = {
  about: { full_name: string; dial: string; phone: string; country: string; headline: string; summary: string };
  work_prefs: { expected_salary: string; salary_currency: string; employment_types: string[]; preferred_categories: string[]; available_from: string; preferred_hours: string; time_zone: string; years_experience: string };
  computer: Row & { has_webcam: string; has_microphone: string };
  work: Row[]; education: Row[];
  certs: { qualifications: string; items: Row[] };
  skills: { skills: string; languages: Row[] };
};

const NAV: [SectionKey | "media", string][] = [
  ["about", "About you"], ["media", "Resume and voice"], ["work_prefs", "Pay and availability"], ["computer", "Computer and internet"],
  ["work", "Work history"], ["education", "Education"], ["certs", "Qualifications"], ["skills", "Skills and languages"],
];

function useSection(key: SectionKey) {
  const [pending, start] = useTransition();
  const [res, setRes] = useState<SaveResult | null>(null);
  const save = (payload: unknown) => start(async () => setRes(await saveSection(key, payload)));
  const err = (k: string) => (res && !res.ok ? res.errors[k] : undefined);
  return { pending, res, save, err };
}

function Section({ id, title, intro, done, children, status, onSave, pending }: {
  id: string; title: string; intro?: string; done: boolean; children: ReactNode; status: SaveResult | null; onSave: () => void; pending: boolean;
}) {
  return (
    <section className="psec" id={id} aria-labelledby={`${id}-h`}>
      <header className="psec__head">
        <h2 id={`${id}-h`}>{title}</h2>
        <span className={`pill ${done ? "pill--ok" : ""}`}>{done ? "Complete" : "To do"}</span>
      </header>
      {intro && <p className="psec__intro">{intro}</p>}
      <div className="psec__body">{children}</div>
      <footer className="psec__foot">
        {status && (status.ok ? <span className="saved" role="status">Saved</span> : <span className="ferr" role="alert">{status.message}</span>)}
        <button type="button" className="btn btn--main btn--sm" onClick={onSave} disabled={pending}>{pending ? "Saving..." : "Save"}</button>
      </footer>
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

export function ProfileEditor({ initial, categories, email, media, mediaDone }: { initial: ProfileData; categories: string[]; email: string; media: ReactNode; mediaDone: boolean }) {
  const [about, setAbout] = useState(initial.about);
  const [prefs, setPrefs] = useState(initial.work_prefs);
  const [pc, setPc] = useState(initial.computer);
  const [work, setWork] = useState(initial.work);
  const [edu, setEdu] = useState(initial.education);
  const [certs, setCerts] = useState(initial.certs);
  const [sk, setSk] = useState(initial.skills);
  const s = { about: useSection("about"), work_prefs: useSection("work_prefs"), computer: useSection("computer"), work: useSection("work"), education: useSection("education"), certs: useSection("certs"), skills: useSection("skills") };
  const zones = useMemo(() => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : ["UTC"]), []);
  const dials = useMemo(() => Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), []);

  const done: Record<SectionKey | "media", boolean> = {
    media: mediaDone,
    about: !!(initial.about.full_name && initial.about.phone && initial.about.country),
    work_prefs: !!(initial.work_prefs.expected_salary && initial.work_prefs.employment_types.length && initial.work_prefs.time_zone),
    computer: !!initial.computer.computer_type,
    work: initial.work.length > 0, education: initial.education.length > 0,
    certs: !!(initial.certs.qualifications || initial.certs.items.length),
    skills: initial.skills.languages.length > 0 && !!initial.skills.skills,
  };
  const count = Object.values(done).filter(Boolean).length;
  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <div className="pedit">
      <aside className="pedit__nav" aria-label="Profile sections">
        <p className="pedit__count"><b>{count} of {NAV.length}</b> sections complete</p>
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
        <Section id="about" title="About you" done={done.about} status={s.about.res} pending={s.about.pending}
          onSave={() => s.about.save({ full_name: about.full_name, phone: `${about.dial} ${about.phone.replace(/[^\d]/g, "")}`, country: about.country, headline: about.headline, summary: about.summary })}>
          <div className="pgrid">
            <F label="Full name" error={s.about.err("full_name")}><input value={about.full_name} onChange={(e) => setAbout({ ...about, full_name: e.target.value })} autoComplete="name" /></F>
            <F label="Email"><input value={email} disabled /></F>
            <F label="Country of residence" error={s.about.err("country")}>
              <select value={about.country} onChange={(e) => { const c = countryByName(e.target.value); setAbout({ ...about, country: e.target.value, dial: c?.dial || about.dial }); }}>
                <option value="" disabled>Choose your country</option>{COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}
              </select>
            </F>
            <F label="Mobile number" error={s.about.err("phone")}>
              <span className="combo"><select aria-label="Dial code" value={about.dial} onChange={(e) => setAbout({ ...about, dial: e.target.value })}>{dials.map((d) => <option key={d}>{d}</option>)}</select>
                <input type="tel" inputMode="tel" value={about.phone} onChange={(e) => setAbout({ ...about, phone: e.target.value })} /></span>
            </F>
            <F label="Professional headline" wide hint="For example: Medical receptionist with 5 years in US clinics"><input value={about.headline} maxLength={120} onChange={(e) => setAbout({ ...about, headline: e.target.value })} /></F>
            <F label="Professional summary" wide><textarea rows={4} maxLength={2000} value={about.summary} onChange={(e) => setAbout({ ...about, summary: e.target.value })} /></F>
          </div>
        </Section>

        {media}

        <Section id="work_prefs" title="Pay and availability" done={done.work_prefs} status={s.work_prefs.res} pending={s.work_prefs.pending} onSave={() => s.work_prefs.save(prefs)}>
          <div className="pgrid">
            <F label="Expected monthly pay" error={s.work_prefs.err("expected_salary")}>
              <span className="combo"><select aria-label="Currency" value={prefs.salary_currency} onChange={(e) => setPrefs({ ...prefs, salary_currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
                <input type="number" min="1" inputMode="numeric" value={prefs.expected_salary} onChange={(e) => setPrefs({ ...prefs, expected_salary: e.target.value })} /></span>
            </F>
            <F label="Years of experience"><input type="number" min="0" max="60" value={prefs.years_experience} onChange={(e) => setPrefs({ ...prefs, years_experience: e.target.value })} /></F>
            <F label="Available to start"><input type="date" value={prefs.available_from} onChange={(e) => setPrefs({ ...prefs, available_from: e.target.value })} /></F>
            <F label="Your time zone" error={s.work_prefs.err("time_zone")}>
              <select value={prefs.time_zone} onChange={(e) => setPrefs({ ...prefs, time_zone: e.target.value })}><option value="" disabled>Choose your time zone</option>{zones.map((z) => <option key={z}>{z}</option>)}</select>
            </F>
            <F label="Preferred working hours" wide hint="For example: 8am to 5pm US Eastern, Monday to Friday"><input value={prefs.preferred_hours} maxLength={120} onChange={(e) => setPrefs({ ...prefs, preferred_hours: e.target.value })} /></F>
            <fieldset className="field field--wide"><legend>Work arrangement</legend>
              <div className="chips">{ARRANGEMENTS.map((a) => <label key={a} className="chip-check"><input type="checkbox" checked={prefs.employment_types.includes(a)} onChange={() => setPrefs({ ...prefs, employment_types: toggle(prefs.employment_types, a) })} />{a}</label>)}</div>
              {s.work_prefs.err("employment_types") && <span className="ferr">{s.work_prefs.err("employment_types")}</span>}
            </fieldset>
            <fieldset className="field field--wide"><legend>Job categories you want</legend>
              <div className="chips">{categories.map((c) => <label key={c} className="chip-check"><input type="checkbox" checked={prefs.preferred_categories.includes(c)} onChange={() => setPrefs({ ...prefs, preferred_categories: toggle(prefs.preferred_categories, c) })} />{c}</label>)}</div>
              {s.work_prefs.err("preferred_categories") && <span className="ferr">{s.work_prefs.err("preferred_categories")}</span>}
            </fieldset>
          </div>
        </Section>

        <Section id="computer" title="Computer and internet" intro="Employers check this against each role. Run a free speed test (for example fast.com) for the internet numbers." done={done.computer} status={s.computer.res} pending={s.computer.pending}
          onSave={() => s.computer.save({ ...pc, has_webcam: pc.has_webcam === "yes", has_microphone: pc.has_microphone === "yes" })}>
          <div className="pgrid">
            <F label="Computer type" error={s.computer.err("computer_type")}><select value={pc.computer_type} onChange={(e) => setPc({ ...pc, computer_type: e.target.value })}><option value="" disabled>Choose</option><option>Desktop</option><option>Laptop</option></select></F>
            <F label="Operating system" error={s.computer.err("operating_system")}><input list="os-list" value={pc.operating_system} onChange={(e) => setPc({ ...pc, operating_system: e.target.value })} placeholder="Windows 11" /></F>
            <F label="Processor (CPU)" error={s.computer.err("processor")}><input value={pc.processor} onChange={(e) => setPc({ ...pc, processor: e.target.value })} placeholder="Intel Core i5, 11th gen" /></F>
            <F label="Memory (RAM)" error={s.computer.err("ram")}><input value={pc.ram} onChange={(e) => setPc({ ...pc, ram: e.target.value })} placeholder="16 GB" /></F>
            <F label="Free storage" error={s.computer.err("storage")}><input value={pc.storage} onChange={(e) => setPc({ ...pc, storage: e.target.value })} placeholder="200 GB" /></F>
            <F label="Internet connection" error={s.computer.err("connection_type")}><select value={pc.connection_type} onChange={(e) => setPc({ ...pc, connection_type: e.target.value })}><option value="" disabled>Choose</option>{["Fiber", "Cable", "DSL", "Mobile data (4G or 5G)", "Satellite", "Other"].map((o) => <option key={o}>{o}</option>)}</select></F>
            <F label="Download speed (Mbps)" error={s.computer.err("download_mbps")}><input type="number" min="0" step="0.1" value={pc.download_mbps} onChange={(e) => setPc({ ...pc, download_mbps: e.target.value })} /></F>
            <F label="Upload speed (Mbps)" error={s.computer.err("upload_mbps")}><input type="number" min="0" step="0.1" value={pc.upload_mbps} onChange={(e) => setPc({ ...pc, upload_mbps: e.target.value })} /></F>
            <F label="Webcam"><select value={pc.has_webcam} onChange={(e) => setPc({ ...pc, has_webcam: e.target.value })}><option value="yes">Yes</option><option value="no">No</option></select></F>
            <F label="Microphone or headset"><select value={pc.has_microphone} onChange={(e) => setPc({ ...pc, has_microphone: e.target.value })}><option value="yes">Yes</option><option value="no">No</option></select></F>
            <F label="Other equipment" wide hint="Second screen, backup power, noise cancelling headset..."><input value={pc.other_equipment} maxLength={500} onChange={(e) => setPc({ ...pc, other_equipment: e.target.value })} /></F>
            <datalist id="os-list"><option>Windows 11</option><option>Windows 10</option><option>macOS</option><option>Linux</option><option>ChromeOS</option></datalist>
          </div>
        </Section>

        <Section id="work" title="Work history" done={done.work} status={s.work.res} pending={s.work.pending} onSave={() => s.work.save(work)}>
          <ListEditor rows={work} setRows={setWork} err={s.work.err} addLabel="Add a job" blank={{ company: "", title: "", start_date: "", end_date: "", description: "" }}
            render={(r, set) => <>
              <F label="Job title"><input value={r.title} onChange={(e) => set("title", e.target.value)} /></F>
              <F label="Company"><input value={r.company} onChange={(e) => set("company", e.target.value)} /></F>
              <F label="Start date"><input type="date" value={r.start_date} onChange={(e) => set("start_date", e.target.value)} /></F>
              <F label="End date" hint="Leave empty if you still work there"><input type="date" value={r.end_date} onChange={(e) => set("end_date", e.target.value)} /></F>
              <F label="What you did" wide><textarea rows={3} maxLength={2000} value={r.description} onChange={(e) => set("description", e.target.value)} /></F>
            </>} />
        </Section>

        <Section id="education" title="Education" done={done.education} status={s.education.res} pending={s.education.pending} onSave={() => s.education.save(edu)}>
          <ListEditor rows={edu} setRows={setEdu} err={s.education.err} addLabel="Add education" blank={{ school: "", degree: "", field: "", start_year: "", end_year: "" }}
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

        <Section id="certs" title="Qualifications" done={done.certs} status={s.certs.res} pending={s.certs.pending} onSave={() => s.certs.save(certs)}>
          <F label="Professional qualifications" wide hint="Anything that makes you right for remote work: tools you know well, industries, achievements."><textarea rows={3} maxLength={2000} value={certs.qualifications} onChange={(e) => setCerts({ ...certs, qualifications: e.target.value })} /></F>
          <h3 className="psub">Certifications and licenses</h3>
          <ListEditor rows={certs.items} setRows={(items) => setCerts({ ...certs, items })} err={(k) => s.certs.err(`items.${k}`)} addLabel="Add a certificate" blank={{ name: "", issuer: "", year: "" }}
            render={(r, set) => <>
              <F label="Name"><input value={r.name} onChange={(e) => set("name", e.target.value)} /></F>
              <F label="Issued by"><input value={r.issuer} onChange={(e) => set("issuer", e.target.value)} /></F>
              <F label="Year"><input type="number" min="1950" max="2100" value={r.year} onChange={(e) => set("year", e.target.value)} /></F>
            </>} />
        </Section>

        <Section id="skills" title="Skills and languages" done={done.skills} status={s.skills.res} pending={s.skills.pending}
          onSave={() => s.skills.save({ skills: sk.skills.split(",").map((x) => x.trim()).filter(Boolean), languages: sk.languages })}>
          <F label="Skills and software" wide hint="Separate with commas. For example: Zendesk, Excel, insurance verification" error={s.skills.err("skills")}><input value={sk.skills} onChange={(e) => setSk({ ...sk, skills: e.target.value })} /></F>
          <h3 className="psub">Languages</h3>
          {s.skills.err("languages") && <span className="ferr">{s.skills.err("languages")}</span>}
          <ListEditor rows={sk.languages} setRows={(languages) => setSk({ ...sk, languages })} err={(k) => s.skills.err(`languages.${k}`)} addLabel="Add a language" blank={{ language: "", level: "Fluent" }}
            render={(r, set) => <>
              <F label="Language"><input value={r.language} onChange={(e) => set("language", e.target.value)} /></F>
              <F label="Level"><select value={r.level} onChange={(e) => set("level", e.target.value)}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></F>
            </>} />
        </Section>
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
