"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveContract, setContractActive, deleteContract } from "@/app/(portal)/portal/admin/contracts/actions";

type Msg = { ok: boolean; text: string } | null;
const Note = ({ msg }: { msg: Msg }) => (msg ? <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span> : null);

export function ContractEditor({ initial, blanks }: { initial: { id: string | null; title: string; body: string }; blanks: [string, string][] }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [body, setBody] = useState(initial.body);
  const box = useRef<HTMLTextAreaElement>(null);
  // Clicking a blank puts it exactly where the cursor is, so it is always spelled right.
  const insert = (tag: string) => {
    const el = box.current;
    const at = el ? el.selectionStart : body.length, end = el ? el.selectionEnd : body.length;
    const next = body.slice(0, at) + tag + body.slice(end);
    setBody(next);
    requestAnimationFrame(() => { if (!el) return; el.focus(); el.setSelectionRange(at + tag.length, at + tag.length); });
  };
  const known = new Set(blanks.map(([k]) => k));
  const wrong = Array.from(new Set(body.match(/\{\{[^{}]*\}\}/g) ?? [])).filter((t) => !known.has(t));
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    setMsg(null);
    const r = await saveContract({ id: initial.id, title, body });
    setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) router.push(`/portal/admin/contracts?edit=${r.id}`);
  });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label className="field"><span>Name of the agreement</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} placeholder="RemoteCore Service Agreement" /></label>
      <div className="field">
        <span>Click a blank to add it where your cursor is. The platform fills it in for each company.</span>
        <div className="chips">{blanks.map(([k, label]) => <button key={k} type="button" className="btn btn--ghost btn--sm" onClick={() => insert(k)} title={k}>{label}</button>)}</div>
      </div>
      {wrong.length > 0 && <p className="ferr" role="alert">These blanks are not known and will not fill in: {wrong.join(", ")}. Delete them and click a blank button instead.</p>}
      <label className="field"><span>Agreement text</span><textarea ref={box} rows={18} value={body} onChange={(e) => setBody(e.target.value)} placeholder={"This agreement is made on {{date}} between RemoteCore Outsourcing LLC and {{company_name}}, represented by {{client_name}}..."} /><em className="hint">Paste the text from your Word or Google document. Line breaks are kept.</em></label>
      <div className="aact__row"><button className="btn btn--main btn--sm" disabled={pending || wrong.length > 0}>{pending ? "Saving..." : "Save agreement"}</button><a className="linkbtn" href="/portal/admin/contracts">Close</a><Note msg={msg} /></div>
    </form>
  );
}

export function ContractRowButtons({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const go = (fn: () => Promise<{ ok: boolean; message?: string }>, ok: string) => start(async () => {
    setMsg(null); const r = await fn();
    setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) router.refresh();
  });
  return (
    <span className="aact__row">
      <a className="btn btn--ghost btn--sm" href={`/portal/admin/contracts?edit=${id}`}>Edit</a>
      {active
        ? <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go(() => setContractActive(id, false), "Turned off. Employers can pay without signing.")}>Turn off</button>
        : <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => go(() => setContractActive(id, true), "In use. Employers sign it before their next payment.")}>Use this one</button>}
      {!active && <button type="button" className="linkbtn small" disabled={pending} onClick={() => { if (confirm("Delete this agreement?")) go(() => deleteContract(id), "Deleted."); }}>Delete</button>}
      <Note msg={msg} />
    </span>
  );
}
