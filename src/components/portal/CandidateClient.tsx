"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setApplicationStatus, openCandidateFile, sendCompanyMessage } from "@/app/(portal)/portal/candidate-actions";
import { APP_STATUS } from "@/lib/portal/seeker";

// Shortlist in one click, or pick any of the 7 statuses. The candidate gets an email and a notice each time.
export function StatusControl({ appId, status }: { appId: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const save = (next: string) => start(async () => {
    setMsg(null);
    const r = await setApplicationStatus(appId, next);
    if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); return; }
    setValue(next);
    setMsg({ ok: true, text: "Status saved. We emailed the candidate." });
    router.refresh();
  });
  const early = ["application_received", "under_review"].includes(status);
  return (
    <div className="cstatus">
      {early && (
        <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => save("shortlisted")}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>
          Shortlist
        </button>
      )}
      <form className="cstatus__form" onSubmit={(e) => { e.preventDefault(); save(value); }}>
        <label className="field"><span>Status</span>
          <select value={value} onChange={(e) => setValue(e.target.value)} disabled={pending}>
            {Object.entries(APP_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
          </select>
        </label>
        <button className="btn btn--ghost btn--sm" disabled={pending || value === status}>{pending ? "Saving..." : "Save status"}</button>
      </form>
      {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
    </div>
  );
}

// Opens a private file through a fresh 5 minute link.
export function FileButton({ appId, kind, index = 0, label }: { appId: string; kind: "resume" | "document"; index?: number; label: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const open = () => {
    const tab = window.open("", "_blank");
    start(async () => {
      setErr("");
      const r = await openCandidateFile(appId, kind, index);
      if (r.ok && r.url) { if (tab) tab.location.href = r.url; else location.href = r.url; return; }
      tab?.close();
      setErr(r.message ?? "Please try again.");
    });
  };
  return (
    <span className="cfile">
      <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={open}>
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        {pending ? "Opening..." : label}
      </button>
      {err && <span className="ferr" role="alert">{err}</span>}
    </span>
  );
}

// The voice intro loads only when the employer presses play.
export function VoicePlayer({ appId }: { appId: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const load = () => start(async () => {
    setErr("");
    const r = await openCandidateFile(appId, "audio");
    if (!r.ok || !r.url) { setErr(r.message ?? "Please try again."); return; }
    setSrc(r.url);
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  });
  return (
    <div className="cvoice">
      {src ? <audio ref={ref} className="maudio" controls src={src} preload="auto" /> : (
        <button type="button" className="btn btn--soft btn--sm" disabled={pending} onClick={load}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          {pending ? "Loading..." : "Play voice intro"}
        </button>
      )}
      {err && <span className="ferr" role="alert">{err}</span>}
    </div>
  );
}

// Message box to the RemoteCore team. "about" ties it to one applicant.
export function MessageBox({ about, aboutLabel }: { about?: string; aboutLabel?: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [link, setLink] = useState(!!about);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      setMsg(null);
      const r = await sendCompanyMessage({ body, about: link ? about : undefined });
      if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); return; }
      setBody(""); setLink(false);
      setMsg({ ok: true, text: "Sent. The RemoteCore team will reply here and by email." });
      router.refresh();
    });
  };
  return (
    <form className="mcompose" onSubmit={send}>
      {about && aboutLabel && (
        <label className="chip-check"><input type="checkbox" checked={link} onChange={(e) => setLink(e.target.checked)} /> About {aboutLabel}</label>
      )}
      <label className="field field--wide"><span>Your message</span>
        <textarea rows={5} maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)} placeholder="For example: can we interview this candidate on Friday?" required />
      </label>
      <div className="mcompose__foot">
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
        <button className="btn btn--main btn--sm" disabled={pending || body.trim().length < 2}>{pending ? "Sending..." : "Send message"}</button>
      </div>
    </form>
  );
}
