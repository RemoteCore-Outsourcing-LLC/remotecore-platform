"use client";
import { useState, useTransition, type KeyboardEvent } from "react";
import { saveJob, type JobInput } from "@/app/(portal)/portal/employer-actions";
import { CURRENCIES } from "@/lib/geo";
import { TYPES, LEVELS } from "@/lib/jobs/search";
import { PERIODS } from "@/lib/employer";

export type JobValues = {
  title: string; category_id: string; description: string; skills: string[]; qualifications: string; experience_level: string;
  salary_min: string; salary_max: string; salary_currency: string; salary_period: string; employment_type: string;
  remote_type: string; location_restrictions: string; computer_requirements: string; hours_time_zone: string; deadline: string; documents_required: string;
};
export const EMPTY_JOB: JobValues = {
  title: "", category_id: "", description: "", skills: [], qualifications: "", experience_level: "", salary_min: "", salary_max: "",
  salary_currency: "USD", salary_period: "month", employment_type: "", remote_type: "fully_remote", location_restrictions: "",
  computer_requirements: "", hours_time_zone: "", deadline: "", documents_required: "",
};

export function JobForm({ id, status, initial, categories }: { id?: string; status?: string; initial: JobValues; categories: { id: number; name: string }[] }) {
  const [v, setV] = useState<JobValues>(initial);
  const [skill, setSkill] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const live = status === "published" || status === "paused";
  const canDraft = !id || status === "draft";
  const clear = (k: string) => setErrors((x) => { if (!x[k]) return x; const n = { ...x }; delete n[k]; return n; });
  const set = (k: keyof JobValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); clear(k); if (k === "salary_max") clear("salary_min"); };

  function addSkill(raw = skill) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    if (!parts.length) return;
    setV((x) => ({ ...x, skills: Array.from(new Set([...x.skills, ...parts])).slice(0, 20) })); clear("skills");
    setSkill("");
  }
  const onSkillKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); }
    if (e.key === "Backspace" && !skill && v.skills.length) setV({ ...v, skills: v.skills.slice(0, -1) });
  };

  const save = (mode: "draft" | "submit") => start(async () => {
    setMsg("");
    const skills = skill.trim() ? Array.from(new Set([...v.skills, ...skill.split(",").map((s) => s.trim()).filter(Boolean)])) : v.skills;
    const r = await saveJob({ ...v, skills, category_id: v.category_id } as unknown as JobInput, { id, mode });
    setErrors(r.errors ?? {});
    if (r.ok) { location.href = `/portal/postings?saved=${mode}`; return; }
    setMsg(r.message ?? "Please try again.");
    document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
  });

  const fe = (k: string) => errors[k] && <span className="ferr">{errors[k]}</span>;
  const bad = (k: string) => !!errors[k];
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save("submit"); }} noValidate>
      {live && <p className="notice">Changes to a live job go to RemoteCore for review. The job is hidden from job seekers until we approve the new version.</p>}

      <section className="psec" aria-labelledby="j1">
        <header className="psec__head"><h2 id="j1">The role</h2></header>
        <div className="psec__body pgrid">
          <label className="field field--wide"><span>Job title</span><input value={v.title} onChange={set("title")} maxLength={120} aria-invalid={bad("title")} placeholder="Customer Support Specialist" />{fe("title")}</label>
          <label className="field"><span>Category</span>
            <select value={v.category_id} onChange={set("category_id")} aria-invalid={bad("category_id")}><option value="">Choose a category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{fe("category_id")}
          </label>
          <label className="field"><span>Employment type</span>
            <select value={v.employment_type} onChange={set("employment_type")} aria-invalid={bad("employment_type")}><option value="">Choose a type</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{fe("employment_type")}
          </label>
          <label className="field field--wide"><span>Job description</span><textarea rows={7} value={v.description} onChange={set("description")} maxLength={8000} aria-invalid={bad("description")} placeholder="What this person will do day to day, and who they will work with." />{fe("description")}</label>
        </div>
      </section>

      <section className="psec" aria-labelledby="j2">
        <header className="psec__head"><h2 id="j2">Skills and experience</h2></header>
        <div className="psec__body pgrid">
          <div className="field field--wide"><span id="sk-l">Required skills</span>
            <div className={`taginput${bad("skills") ? " is-bad" : ""}`}>
              {v.skills.map((s) => <span key={s} className="taginput__tag">{s}<button type="button" onClick={() => setV({ ...v, skills: v.skills.filter((x) => x !== s) })} aria-label={`Remove ${s}`}>×</button></span>)}
              <input value={skill} onChange={(e) => setSkill(e.target.value)} onKeyDown={onSkillKey} onBlur={() => addSkill()} aria-labelledby="sk-l" placeholder={v.skills.length ? "Add another" : "Type a skill and press Enter"} />
            </div>
            <em className="hint">Press Enter or a comma after each skill. Up to 20.</em>{fe("skills")}
          </div>
          <label className="field"><span>Experience level</span>
            <select value={v.experience_level} onChange={set("experience_level")} aria-invalid={bad("experience_level")}><option value="">Choose a level</option>{LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{fe("experience_level")}
          </label>
          <span />
          <label className="field field--wide"><span>Required qualifications and experience</span><textarea rows={4} value={v.qualifications} onChange={set("qualifications")} maxLength={3000} aria-invalid={bad("qualifications")} placeholder="For example: 2 years of customer support, fluent written English, a diploma or degree." />{fe("qualifications")}</label>
        </div>
      </section>

      <section className="psec" aria-labelledby="j3">
        <header className="psec__head"><h2 id="j3">Pay, location and hours</h2></header>
        <div className="psec__body pgrid">
          <div className="field field--wide"><span id="pay-l">Pay range</span>
            <div className="payrow">
              <select aria-label="Currency" value={v.salary_currency} onChange={set("salary_currency")}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
              <input aria-label="Lowest pay" inputMode="numeric" value={v.salary_min} onChange={set("salary_min")} placeholder="From" aria-invalid={bad("salary_min")} />
              <input aria-label="Highest pay" inputMode="numeric" value={v.salary_max} onChange={set("salary_max")} placeholder="To (optional)" aria-invalid={bad("salary_max")} />
              <select aria-label="Pay period" value={v.salary_period} onChange={set("salary_period")}>{PERIODS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
            </div>{fe("salary_min")}{fe("salary_max")}
          </div>
          <fieldset className="field field--wide"><legend>Remote work</legend>
            <div className="chips">
              <label className="chip-check"><input type="radio" name="remote" checked={v.remote_type === "fully_remote"} onChange={() => { setV({ ...v, remote_type: "fully_remote" }); clear("location_restrictions"); }} />Fully remote, anywhere</label>
              <label className="chip-check"><input type="radio" name="remote" checked={v.remote_type === "location_restricted"} onChange={() => setV({ ...v, remote_type: "location_restricted" })} />Remote, some locations only</label>
            </div>
          </fieldset>
          {v.remote_type === "location_restricted" && (
            <label className="field field--wide"><span>Who can apply</span><input value={v.location_restrictions} onChange={set("location_restrictions")} maxLength={300} aria-invalid={bad("location_restrictions")} placeholder="Philippines, Jamaica or Colombia" />{fe("location_restrictions")}</label>
          )}
          <label className="field"><span>Working hours and time zone</span><input value={v.hours_time_zone} onChange={set("hours_time_zone")} maxLength={200} aria-invalid={bad("hours_time_zone")} placeholder="9am to 5pm US Eastern" />{fe("hours_time_zone")}</label>
          <label className="field"><span>Application deadline</span><input type="date" value={v.deadline} onChange={set("deadline")} aria-invalid={bad("deadline")} />{fe("deadline")}</label>
        </div>
      </section>

      <section className="psec" aria-labelledby="j4">
        <header className="psec__head"><h2 id="j4">Equipment and documents</h2></header>
        <div className="psec__body pgrid">
          <label className="field field--wide"><span>Required computer and internet <em className="hint">optional</em></span><textarea rows={3} value={v.computer_requirements} onChange={set("computer_requirements")} maxLength={2000} placeholder="For example: laptop with 8 GB RAM, 25 Mbps internet, headset with microphone, webcam." /></label>
          <label className="field field--wide"><span>Extra documents applicants must send <em className="hint">optional</em></span><input value={v.documents_required} onChange={set("documents_required")} maxLength={500} placeholder="For example: a typing test result" /><em className="hint">Leave empty if the profile and resume are enough.</em></label>
        </div>
      </section>

      <div className="formbar">
        {msg && <span className="ferr" role="alert">{msg}</span>}
        <a className="btn btn--ghost btn--sm formbar__cancel" href="/portal/postings">Cancel</a>
        {canDraft && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => save("draft")}>Save as draft</button>}
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : live ? "Send changes for review" : "Send for review"}</button>
      </div>
    </form>
  );
}
