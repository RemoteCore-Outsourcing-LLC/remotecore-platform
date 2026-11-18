"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { setMedia } from "@/app/(portal)/portal/profile/media-actions";

const MB = 1024 * 1024;
const RESUME_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const AUDIO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3", "audio/mp3": "mp3", "audio/mp4": "m4a", "audio/x-m4a": "m4a", "audio/m4a": "m4a",
  "audio/wav": "wav", "audio/x-wav": "wav", "audio/wave": "wav", "audio/webm": "webm", "audio/ogg": "ogg", "audio/aac": "aac",
};
const MAX_SECONDS = 180;

type Props = { userId: string; resume: { name: string; url: string } | null; audio: { url: string } | null };

async function upload(bucket: string, path: string, file: Blob, type: string) {
  const { error } = await supabaseBrowser().storage.from(bucket).upload(path, file, { contentType: type, upsert: false });
  return error;
}


// Browsers often label .webm and .m4a files as video, so trust the file name when the type is not audio.
const BY_EXT: Record<string, string> = { mp3: "audio/mpeg", m4a: "audio/mp4", mp4: "audio/mp4", wav: "audio/wav", webm: "audio/webm", ogg: "audio/ogg", aac: "audio/aac" };
function audioType(f: File) {
  if (f.type.startsWith("audio/")) return f.type;
  return BY_EXT[f.name.split(".").pop()?.toLowerCase() ?? ""] ?? f.type;
}

export function MediaSection({ userId, resume, audio }: Props) {
  const done = !!resume && !!audio;
  return (
    <section className="psec" id="media" aria-labelledby="media-h">
      <header className="psec__head">
        <h2 id="media-h">Resume and voice introduction</h2>
        <span className={`pill ${done ? "pill--ok" : ""}`}>{done ? "Complete" : "To do"}</span>
      </header>
      <p className="psec__intro">Only the RemoteCore team and employers you apply to can open these files.</p>
      <div className="psec__body media">
        <ResumeBox userId={userId} current={resume} />
        <AudioBox userId={userId} current={audio} />
      </div>
    </section>
  );
}

function ResumeBox({ userId, current }: { userId: string; current: Props["resume"] }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function onPick(file: File | undefined) {
    if (!file) return;
    const ext = RESUME_TYPES[file.type] ?? (/\.(pdf|docx?)$/i.exec(file.name)?.[1]?.toLowerCase());
    if (!ext) return setMsg({ ok: false, text: "Please choose a PDF or Word file." });
    if (file.size > 10 * MB) return setMsg({ ok: false, text: "This file is over 10 MB. Please choose a smaller one." });
    setBusy(true); setMsg(null);
    const type = Object.keys(RESUME_TYPES).find((k) => RESUME_TYPES[k] === ext) ?? file.type;
    const path = `${userId}/resume-${Date.now()}.${ext}`;
    const err = await upload("resumes", path, file, type);
    const res = err ? { ok: false, message: "Upload failed. Please try again." } : await setMedia("resume", path);
    setBusy(false);
    setMsg(res.ok ? { ok: true, text: "Resume saved" } : { ok: false, text: res.message ?? "Upload failed." });
    if (input.current) input.current.value = "";
  }

  return (
    <div className="mbox">
      <h3>Resume</h3>
      {current ? (
        <p className="mfile"><a href={current.url} target="_blank" rel="noopener">{current.name}</a></p>
      ) : (
        <p className="soft">No resume yet. PDF or Word, up to 10 MB.</p>
      )}
      <input ref={input} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" hidden onChange={(e) => onPick(e.target.files?.[0])} />
      <div className="mrow">
        <button type="button" className="btn btn--ghost btn--sm" disabled={busy} onClick={() => input.current?.click()}>{busy ? "Uploading..." : current ? "Replace resume" : "Upload resume"}</button>
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
      </div>
    </div>
  );
}

function pickMime() {
  if (typeof MediaRecorder === "undefined") return null;
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac"]) if (MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

function AudioBox({ userId, current }: { userId: string; current: Props["audio"] }) {
  const [state, setState] = useState<"idle" | "recording" | "review" | "saving">("idle");
  const [secs, setSecs] = useState(0);
  const [take, setTake] = useState<{ blob: Blob; url: string; type: string } | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [canRecord, setCanRecord] = useState(false);
  useEffect(() => { setCanRecord(!!navigator.mediaDevices?.getUserMedia && pickMime() !== null); }, []);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); if (take) URL.revokeObjectURL(take.url); }, [take]);

  async function start() {
    setMsg(null);
    let stream: MediaStream;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return setMsg({ ok: false, text: "We could not use your microphone. Allow microphone access in your browser, or upload a recording instead." }); }
    const mime = pickMime() || undefined;
    const r = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    const chunks: Blob[] = [];
    r.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    r.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const type = (r.mimeType || mime || "audio/webm").split(";")[0];
      const blob = new Blob(chunks, { type });
      setTake({ blob, url: URL.createObjectURL(blob), type });
      setState("review");
    };
    rec.current = r;
    r.start(1000);
    setSecs(0); setState("recording");
    timer.current = setInterval(() => setSecs((s) => { if (s + 1 >= MAX_SECONDS) stop(); return s + 1; }), 1000);
  }
  function stop() {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    if (rec.current && rec.current.state !== "inactive") rec.current.stop();
  }

  async function save(blob: Blob, type: string) {
    const clean = type.split(";")[0];
    const ext = AUDIO_EXT[clean];
    if (!ext) return setMsg({ ok: false, text: "Please use an MP3, M4A, WAV or WebM audio file." });
    if (blob.size > 10 * MB) return setMsg({ ok: false, text: "This recording is over 10 MB. Please keep it under about 5 minutes." });
    setState("saving"); setMsg(null);
    const path = `${userId}/intro-${Date.now()}.${ext}`;
    const err = await upload("audio", path, blob, clean);
    const res = err ? { ok: false, message: "Upload failed. Please try again." } : await setMedia("audio", path);
    setState("idle");
    if (res.ok) { setTake(null); setMsg({ ok: true, text: "Voice introduction saved" }); }
    else setMsg({ ok: false, text: res.message ?? "Upload failed." });
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  return (
    <div className="mbox">
      <h3>Voice introduction</h3>
      <p className="soft">In 1 to 3 minutes, tell employers about your background, your skills, your experience and the work you are looking for.</p>
      {current && state !== "review" && <audio className="maudio" controls preload="none" src={current.url} />}
      {state === "recording" && (
        <div className="mrec" role="status"><i aria-hidden="true" />Recording {mmss(secs)} of {mmss(MAX_SECONDS)}</div>
      )}
      {state === "review" && take && (
        <>
          <audio className="maudio" controls src={take.url} />
          <p className="soft" style={{ fontSize: 14 }}>Listen back. Happy with it? Save it to your profile.</p>
        </>
      )}
      <div className="mrow">
        {state === "idle" && canRecord && <button type="button" className="btn btn--main btn--sm" onClick={start}>{current ? "Record a new one" : "Start recording"}</button>}
        {state === "recording" && <button type="button" className="btn btn--main btn--sm" onClick={stop}>Stop</button>}
        {state === "review" && take && <>
          <button type="button" className="btn btn--main btn--sm" onClick={() => save(take.blob, take.type)}>Save recording</button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setTake(null); setState("idle"); }}>Discard</button>
        </>}
        {state === "saving" && <span className="soft">Saving...</span>}
        {(state === "idle") && <button type="button" className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>Upload a file</button>}
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
      </div>
      <input ref={input} type="file" accept="audio/*,.mp3,.m4a,.wav,.webm" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) save(f, audioType(f)); e.target.value = ""; }} />
    </div>
  );
}
