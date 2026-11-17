"use client";
import { useEffect, useState, useTransition } from "react";
import { toggleSave, markAllRead, setMarketplace, deleteAccount } from "@/app/(portal)/portal/actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function SaveJobButton({ jobId, saved: initial, compact }: { jobId: string; saved: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initial);
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const click = () => start(async () => {
    const next = !saved;
    setSaved(next); setErr("");
    const r = await toggleSave(jobId, next);
    if (!r.ok) { setSaved(!next); setErr(r.message ?? "Try again."); }
  });
  return (
    <span className="savejob">
      <button type="button" className={`btn btn--sm ${saved ? "btn--soft" : "btn--ghost"}`} onClick={click} disabled={pending} aria-pressed={saved}>
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
        {saved ? "Saved" : compact ? "Save" : "Save job"}
      </button>
      {err && <span className="ferr" role="alert">{err}</span>}
    </span>
  );
}

export function MarkAllReadButton() {
  const [pending, start] = useTransition();
  return <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => start(async () => { await markAllRead(); })}>{pending ? "Marking..." : "Mark all as read"}</button>;
}

export function PasswordForm() {
  const [pw, setPw] = useState(""); const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setMsg({ ok: false, text: "Use at least 8 characters." });
    if (pw !== pw2) return setMsg({ ok: false, text: "The two passwords do not match." });
    start(async () => {
      const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
      if (error) setMsg({ ok: false, text: error.message.includes("different") ? "Choose a password you have not used here before." : "We could not change your password. Please try again." });
      else { setMsg({ ok: true, text: "Password changed" }); setPw(""); setPw2(""); }
    });
  };
  return (
    <form onSubmit={submit} className="psec__body" noValidate>
      <div className="pgrid">
        <label className="field"><span>New password</span><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" minLength={8} required /></label>
        <label className="field"><span>Type it again</span><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" required /></label>
      </div>
      <div className="formfoot">
        {msg && (msg.ok ? <span className="saved" role="status">{msg.text}</span> : <span className="ferr" role="alert">{msg.text}</span>)}
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : "Change password"}</button>
      </div>
    </form>
  );
}

export function MarketplaceToggle({ consent, status, since }: { consent: boolean; status: string; since: string | null }) {
  const [on, setOn] = useState(consent);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const flip = () => start(async () => {
    const next = !on; setOn(next); setMsg("");
    const r = await setMarketplace(next);
    if (!r.ok) { setOn(!next); setMsg(r.message ?? "Try again."); }
  });
  const state = !on ? "Hidden. Employers cannot browse your profile." :
    status === "published" ? "Listed in the Talent Marketplace." :
    status === "paused" ? "Listing paused by RemoteCore." : "Waiting for RemoteCore to review your listing.";
  return (
    <div className="psec__body">
      <label className="switch">
        <input type="checkbox" role="switch" checked={on} onChange={flip} disabled={pending} />
        <span className="switch__track" aria-hidden="true"><i /></span>
        <span className="switch__text"><b>Show my profile in the Talent Marketplace</b><span className="soft">{state}{on && since ? ` Consent given ${since}.` : ""}</span></span>
      </label>
      <p className="soft small">Your card shows only your first name, headline, skills and country. Your email, phone number, resume and voice introduction stay private. Employers ask RemoteCore for an introduction.</p>
      {msg && <span className="ferr" role="alert">{msg}</span>}
    </div>
  );
}

export function DeleteAccount() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const go = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await deleteAccount(text);
      if (r.ok) location.href = "/?account=deleted";
      else setMsg(r.message ?? "Try again.");
    });
  };
  if (!open) return (
    <div className="psec__body">
      <p className="soft">This removes your profile, resume, voice introduction, saved jobs and applications for good. It cannot be undone.</p>
      <div><button type="button" className="btn btn--danger btn--sm" onClick={() => setOpen(true)}>Delete my account</button></div>
    </div>
  );
  return (
    <form className="psec__body" onSubmit={go}>
      <label className="field"><span>Type DELETE to confirm</span><input value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCapitalize="characters" spellCheck={false} /></label>
      <div className="formfoot">
        {msg && <span className="ferr" role="alert">{msg}</span>}
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setOpen(false); setText(""); setMsg(""); }}>Cancel</button>
        <button className="btn btn--danger btn--sm" disabled={pending || text.trim().toUpperCase() !== "DELETE"}>{pending ? "Deleting..." : "Delete for good"}</button>
      </div>
    </form>
  );
}

// Date and time in the visitor's own time zone (the server does not know it).
export function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => new Date(iso).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "UTC" }));
  useEffect(() => { setText(new Date(iso).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })); }, [iso]);
  return <time dateTime={iso}>{text}</time>;
}
