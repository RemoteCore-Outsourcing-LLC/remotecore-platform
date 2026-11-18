"use client";
import { useState, useTransition } from "react";
import { setJobStatus, createStaffingRequest, type RequestInput } from "@/app/(portal)/portal/employer-actions";
import { LEVELS } from "@/lib/jobs/search";

// Pause, close or turn a job back on, from the jobs list.
export function JobStatusActions({ id, status, approvedBefore }: { id: string; status: string; approvedBefore: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const go = (s: "paused" | "closed" | "published") => start(async () => {
    if (s === "closed" && !confirm("Close this job? It stops taking applications.")) return;
    setMsg("");
    const r = await setJobStatus(id, s);
    if (!r.ok) setMsg(r.message ?? "Please try again.");
  });
  return (
    <span className="jact">
      <a className="btn btn--ghost btn--sm" href={`/portal/postings/${id}`}>Edit</a>
      {status === "published" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go("paused")}>Pause</button>}
      {status === "paused" && approvedBefore && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go("published")}>Turn back on</button>}
      {status !== "closed" && status !== "draft" && <button type="button" className="linkbtn" disabled={pending} onClick={() => go("closed")}>Close</button>}
      {msg && <span className="ferr" role="alert">{msg}</span>}
    </span>
  );
}

const EMPTY = { position: "", number_needed: "1", skills: "", experience_level: "", compensation: "", region: "", start_date: "", details: "", phone: "", fee_acknowledged: false };

export function StaffingRequestForm({ company }: { company: { name: string; contact: string; email: string; phone: string } }) {
  const [v, setV] = useState({ ...EMPTY, phone: company.phone });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setErrors((x) => { const n = { ...x }; delete n[k]; return n; }); };
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setMsg("");
      const r = await createStaffingRequest(v as unknown as RequestInput);
      setErrors(r.errors ?? {});
      if (r.ok) { location.href = "/portal/requests?sent=1"; return; }
      setMsg(r.message ?? "Please check the fields marked in red.");
    });
  };
  const fe = (k: string) => errors[k] && <span className="ferr">{errors[k]}</span>;
  const bad = (k: string) => !!errors[k];
  return (
    <form className="stack" onSubmit={submit} noValidate>
      <section className="psec" aria-labelledby="r0">
        <header className="psec__head"><h2 id="r0">Company</h2><a href="/portal/company">Edit company profile</a></header>
        <div className="psec__body">
          <dl className="facts"><dt>Company</dt><dd>{company.name}</dd><dt>Contact</dt><dd>{company.contact}</dd><dt>Email</dt><dd>{company.email}</dd></dl>
          <label className="field" style={{ maxWidth: 320 }}><span>Best phone for this request</span><input value={v.phone} onChange={set("phone")} type="tel" maxLength={40} /></label>
        </div>
      </section>
      <section className="psec" aria-labelledby="r1">
        <header className="psec__head"><h2 id="r1">Who you need</h2></header>
        <div className="psec__body pgrid">
          <label className="field"><span>Position or service</span><input value={v.position} onChange={set("position")} maxLength={200} aria-invalid={bad("position")} placeholder="Medical billing specialist" />{fe("position")}</label>
          <label className="field"><span>How many people</span><input type="number" min={1} max={500} value={v.number_needed} onChange={set("number_needed")} aria-invalid={bad("number_needed")} />{fe("number_needed")}</label>
          <label className="field field--wide"><span>Skills and qualifications</span><textarea rows={4} value={v.skills} onChange={set("skills")} maxLength={3000} aria-invalid={bad("skills")} placeholder="The skills, tools and certificates this person needs." />{fe("skills")}</label>
          <label className="field"><span>Experience level</span>
            <select value={v.experience_level} onChange={set("experience_level")} aria-invalid={bad("experience_level")}><option value="">Choose a level</option>{LEVELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>{fe("experience_level")}
          </label>
          <label className="field"><span>Pay range you have in mind</span><input value={v.compensation} onChange={set("compensation")} maxLength={200} aria-invalid={bad("compensation")} placeholder="USD 900 to 1,200 a month" />{fe("compensation")}</label>
          <label className="field"><span>Preferred country or region <em className="hint">optional</em></span><input value={v.region} onChange={set("region")} maxLength={200} placeholder="Caribbean, Latin America, Philippines or anywhere" /></label>
          <label className="field"><span>Start date</span><input type="date" value={v.start_date} onChange={set("start_date")} aria-invalid={bad("start_date")} />{fe("start_date")}</label>
          <label className="field field--wide"><span>Anything else we should know <em className="hint">optional</em></span><textarea rows={4} value={v.details} onChange={set("details")} maxLength={4000} placeholder="Working hours, software you use, languages, how you like to interview." /></label>
        </div>
      </section>
      <label className="apply__ok">
        <input type="checkbox" checked={v.fee_acknowledged} onChange={(e) => setV({ ...v, fee_acknowledged: e.target.checked })} />
        <span>I understand that hiring through RemoteCore includes an agreed placement fee, with final terms provided before engagement.</span>
      </label>
      {fe("fee_acknowledged")}
      <div className="formbar">
        {msg && <span className="ferr" role="alert">{msg}</span>}
        <a className="btn btn--ghost btn--sm formbar__cancel" href="/portal/requests">Cancel</a>
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Sending..." : "Send staffing request"}</button>
      </div>
    </form>
  );
}
