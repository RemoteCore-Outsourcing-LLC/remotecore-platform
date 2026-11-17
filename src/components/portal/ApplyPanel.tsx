"use client";
import { useRef, useState, useTransition } from "react";
import { applyToJob } from "@/app/(portal)/portal/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

const MB = 1024 * 1024;
const OK_TYPES: Record<string, string> = {
  pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png",
};
type Doc = { name: string; path: string };

export type ApplyProps = {
  jobId: string; jobTitle: string; userId: string; docsRequired: string | null;
  profile: { name: string; headline: string; resume: boolean; audio: boolean; done: number; total: number };
};

export function ApplyPanel({ jobId, jobTitle, userId, docsRequired, profile }: ApplyProps) {
  const [note, setNote] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ at: string; ref: string } | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function addFile(file?: File) {
    if (!file) return;
    setMsg("");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const type = OK_TYPES[ext];
    if (!type) return setMsg("Use a PDF, Word file, JPG or PNG.");
    if (file.size > 10 * MB) return setMsg("This file is over 10 MB. Please choose a smaller one.");
    if (docs.length >= 3) return setMsg("You can add up to 3 documents.");
    setBusy(true);
    const safe = file.name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/gi, "-").slice(0, 40) || "document";
    const path = `${userId}/doc-${Date.now()}-${safe}.${ext}`;
    const { error } = await supabaseBrowser().storage.from("documents").upload(path, file, { contentType: type, upsert: false });
    setBusy(false);
    if (error) return setMsg("The upload did not work. Please try again.");
    setDocs((d) => [...d, { name: file.name, path }]);
  }
  async function removeDoc(path: string) {
    setDocs((d) => d.filter((x) => x.path !== path));
    await supabaseBrowser().storage.from("documents").remove([path]);
  }
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    if (docsRequired && docs.length === 0) return setMsg("This job asks for an extra document. Please add it.");
    if (!confirm) return setMsg("Please tick the box to confirm.");
    start(async () => {
      const r = await applyToJob({ jobId, note, documents: docs.map((d) => d.path), confirm });
      if (r.ok && r.appliedAt) setDone({ at: r.appliedAt, ref: r.ref ?? "" });
      else setMsg(r.message ?? "Please try again.");
    });
  };

  if (done) {
    const when = new Date(done.at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
    return (
      <section className="apply apply--done" id="apply" aria-labelledby="ap-h" role="status" tabIndex={-1} ref={(el) => el?.focus()}>
        <svg width="34" height="34" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor" /><path d="m7 12.5 3.2 3L17 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div>
          <h2 id="ap-h">Application sent</h2>
          <p>We received your application for <b>{jobTitle}</b> on {when}. Reference {done.ref}.</p>
          <p className="soft">Its status starts at Application received. We will let you know here and by email when it changes.</p>
          <div className="apply__act">
            <a className="btn btn--main btn--sm" href="/portal/applications">See my applications</a>
            <a className="btn btn--ghost btn--sm" href="/portal/jobs">Keep browsing jobs</a>
          </div>
        </div>
      </section>
    );
  }

  if (!profile.resume) {
    return (
      <section className="apply" id="apply" aria-labelledby="ap-h">
        <h2 id="ap-h">Apply for this job</h2>
        <p className="soft">Employers need your resume. Add it to your profile, then come back to apply.</p>
        <div className="apply__act"><a className="btn btn--main btn--sm" href="/portal/profile#media">Add my resume</a></div>
      </section>
    );
  }

  return (
    <form className="apply" id="apply" aria-labelledby="ap-h" onSubmit={submit} noValidate>
      <h2 id="ap-h">Apply for this job</h2>
      <div className="apply__send">
        <p className="apply__label">What we send</p>
        <ul>
          <li><b>{profile.name || "Your profile"}</b>{profile.headline ? `, ${profile.headline}` : ""}</li>
          <li>Your full profile ({profile.done} of {profile.total} sections complete)</li>
          <li>Your resume</li>
          {profile.audio && <li>Your voice introduction</li>}
        </ul>
        {profile.done < profile.total && <p className="soft small">Complete profiles get reviewed first. <a href="/portal/profile">Finish your profile</a> before you apply if you can.</p>}
      </div>

      <label className="field">
        <span>Note to the employer <em className="hint">optional</em></span>
        <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 1500))} rows={4} placeholder="Why this role fits you, in a few lines." />
        <em className="hint">{1500 - note.length} characters left</em>
      </label>

      <div className="field">
        <span>{docsRequired ? "Documents this job asks for" : "Extra documents"} {!docsRequired && <em className="hint">optional</em>}</span>
        {docsRequired && <p className="apply__req">{docsRequired}</p>}
        {docs.length > 0 && (
          <ul className="apply__docs">
            {docs.map((d) => <li key={d.path}><span>{d.name}</span><button type="button" className="linkbtn" onClick={() => removeDoc(d.path)} aria-label={`Remove ${d.name}`}>Remove</button></li>)}
          </ul>
        )}
        {docs.length < 3 && (
          <div>
            <input ref={input} type="file" hidden accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={(e) => { addFile(e.target.files?.[0]); e.target.value = ""; }} />
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => input.current?.click()} disabled={busy}>{busy ? "Uploading..." : "Add a document"}</button>
            <em className="hint" style={{ display: "block", marginTop: 6 }}>PDF, Word, JPG or PNG, up to 10 MB. Up to 3 files.</em>
          </div>
        )}
      </div>

      <label className="apply__ok">
        <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} />
        <span>I confirm my profile is accurate, and I agree to share it with RemoteCore and this employer for this job.</span>
      </label>

      <div className="apply__foot">
        {msg && <span className="ferr" role="alert">{msg}</span>}
        <button className="btn btn--main" disabled={pending || busy}>{pending ? "Sending..." : "Send application"}</button>
      </div>
    </form>
  );
}
