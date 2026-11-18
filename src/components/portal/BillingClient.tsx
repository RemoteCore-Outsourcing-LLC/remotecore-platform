"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { payInvoice } from "@/app/(portal)/portal/billing-actions";
import { createInvoice, sendInvoice, voidInvoice, refund, saveFeeType } from "@/app/(portal)/portal/admin/billing-actions";

type Msg = { ok: boolean; text: string } | null;
const Note = ({ msg }: { msg: Msg }) => (msg ? <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span> : null);
const toCents = (v: string) => Math.round(Number(String(v).replace(/[^0-9.]/g, "")) * 100) || 0;
const fmt = (cents: number, cur: string) => new Intl.NumberFormat("en-US", { style: "currency", currency: cur.toUpperCase() }).format(cents / 100);

// Employer: opens the secure Stripe payment page.
export function PayButton({ id, label }: { id: string; label: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  return (
    <span className="aact">
      <button type="button" className="btn btn--main" disabled={pending} onClick={() => start(async () => { setErr(""); const r = await payInvoice(id); if (r.ok && r.url) location.href = r.url; else setErr(r.message ?? "Please try again."); })}>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3 10h18" stroke="currentColor" strokeWidth="1.8" /></svg>
        {pending ? "Opening the secure page..." : label}
      </button>
      {err && <span className="ferr" role="alert">{err}</span>}
    </span>
  );
}

type Fee = { id: number; name: string; kind: string; default_cents: number | null; default_percent: number | null };
type Line = { feeTypeId: number | null; description: string; amount: string; salary: string; percent: string };

// Team: make an invoice from fee types. A percent fee is worked out from the salary you type.
export function InvoiceForm({ companies, fees, presetCompany }: { companies: { id: string; name: string }[]; fees: Fee[]; presetCompany?: string }) {
  const router = useRouter();
  const [v, setV] = useState({ companyId: presetCompany ?? "", description: "", dueDate: "", note: "", currency: "usd" });
  const blank = (): Line => ({ feeTypeId: null, description: "", amount: "", salary: "", percent: "" });
  const [lines, setLines] = useState<Line[]>([blank()]);
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const fee = (id: number | null) => fees.find((f) => f.id === id);
  const lineCents = (l: Line) => (fee(l.feeTypeId)?.kind === "percent" ? Math.round(toCents(l.salary) * (Number(l.percent) || 0) / 100) : toCents(l.amount));
  const total = lines.reduce((n, l) => n + lineCents(l), 0);
  const setLine = (i: number, patch: Partial<Line>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const pickFee = (i: number, id: string) => {
    const f = fee(Number(id) || null);
    setLine(i, { feeTypeId: f?.id ?? null, description: f?.name ?? lines[i].description, amount: f?.default_cents != null ? String(f.default_cents / 100) : "", percent: f?.default_percent != null ? String(f.default_percent) : "" });
  };
  const save = (send: boolean) => start(async () => {
    setMsg(null);
    const items = lines.map((l) => {
      const f = fee(l.feeTypeId);
      const base = l.description.trim() || f?.name || v.description.trim();
      const desc = f?.kind === "percent" ? `${base} (${l.percent}% of ${fmt(toCents(l.salary), v.currency)})` : base;
      return { feeTypeId: l.feeTypeId, description: desc, amountCents: lineCents(l) };
    });
    const r = await createInvoice({ ...v, items }, send);
    if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); if (r.id) router.push(`/portal/admin/billing/${r.id}`); return; }
    router.push(`/portal/admin/billing/${r.id}?made=${send ? "sent" : "draft"}`);
  });
  return (
    <form className="stack" onSubmit={(e) => { e.preventDefault(); save(true); }}>
      <section className="psec">
        <div className="psec__body pgrid">
          <label className="field"><span>Company</span>
            <select value={v.companyId} onChange={(e) => setV({ ...v, companyId: e.target.value })} required>
              <option value="">Choose a company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Currency</span>
            <select value={v.currency} onChange={(e) => setV({ ...v, currency: e.target.value })}>{["usd", "eur", "gbp", "cad", "aud"].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}</select>
          </label>
          <label className="field field--wide"><span>What it is for</span><input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={200} placeholder="For example: Placement of a medical billing specialist" required /></label>
          <label className="field"><span>Due date <em className="hint">optional</em></span><input type="date" value={v.dueDate} onChange={(e) => setV({ ...v, dueDate: e.target.value })} /></label>
          <label className="field"><span>Note on the invoice <em className="hint">optional</em></span><input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} maxLength={1000} /></label>
        </div>
      </section>
      <section className="psec" aria-labelledby="lines-h">
        <header className="psec__head"><h2 id="lines-h">Lines</h2></header>
        <ol className="psec__body sedit">
          {lines.map((l, i) => {
            const f = fee(l.feeTypeId);
            return (
              <li key={i} className="sedit__item pgrid">
                <label className="field"><span>Fee</span>
                  <select value={l.feeTypeId ?? ""} onChange={(e) => pickFee(i, e.target.value)}>
                    <option value="">Other</option>
                    {fees.map((x) => <option key={x.id} value={x.id}>{x.name}{x.kind === "percent" ? " (% of salary)" : ""}</option>)}
                  </select>
                </label>
                <label className="field"><span>Description</span><input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} maxLength={150} /></label>
                {f?.kind === "percent" ? (
                  <>
                    <label className="field"><span>Yearly salary</span><input inputMode="decimal" value={l.salary} onChange={(e) => setLine(i, { salary: e.target.value })} placeholder="24000" /></label>
                    <label className="field"><span>Percent</span><input inputMode="decimal" value={l.percent} onChange={(e) => setLine(i, { percent: e.target.value })} placeholder="15" /></label>
                  </>
                ) : (
                  <label className="field"><span>Amount</span><input inputMode="decimal" value={l.amount} onChange={(e) => setLine(i, { amount: e.target.value })} placeholder="500.00" /></label>
                )}
                <div className="aact__row field--wide"><b>{fmt(lineCents(l), v.currency)}</b>{lines.length > 1 && <button type="button" className="linkbtn small" onClick={() => setLines(lines.filter((_, j) => j !== i))}>Remove line</button>}</div>
              </li>
            );
          })}
        </ol>
        <div className="psec__body"><button type="button" className="btn btn--ghost btn--sm" disabled={lines.length >= 20} onClick={() => setLines([...lines, blank()])}>Add a line</button></div>
      </section>
      <div className="formbar">
        <Note msg={msg} />
        <span className="bill__total">Total <b>{fmt(total, v.currency)}</b></span>
        <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => save(false)}>Save as draft</button>
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : "Save and send"}</button>
      </div>
    </form>
  );
}

// Team: send, cancel or refund one invoice.
export function InvoiceActions({ id, status, leftCents, currency }: { id: string; status: string; leftCents: number; currency: string }) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [amount, setAmount] = useState((leftCents / 100).toFixed(2));
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<{ ok: boolean; message?: string }>, ok: string) => start(async () => { setMsg(null); const r = await fn(); setMsg(r.ok ? { ok: true, text: ok } : { ok: false, text: r.message ?? "Please try again." }); if (r.ok) router.refresh(); });
  return (
    <div className="aact">
      <div className="aact__row">
        {status === "draft" && <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => run(() => sendInvoice(id), "Sent. We emailed the employer a pay link.")}>Send to the employer</button>}
        {status === "open" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => run(() => sendInvoice(id), "Sent again.")}>Send the email again</button>}
        {(status === "draft" || status === "open") && <button type="button" className="linkbtn small" disabled={pending} onClick={() => { if (confirm("Cancel this invoice? The employer can no longer pay it.")) run(() => voidInvoice(id), "Cancelled."); }}>Cancel invoice</button>}
      </div>
      {(status === "paid" || status === "partially_refunded") && leftCents > 0 && (
        <form className="aact__row" onSubmit={(e) => { e.preventDefault(); if (confirm(`Refund ${fmt(toCents(amount), currency)} to the employer's card?`)) run(() => refund(id, toCents(amount)), "Refund sent. It reaches their card in 5 to 10 days."); }}>
          <label className="field"><span>Refund amount</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} /></label>
          <button className="btn btn--danger btn--sm" disabled={pending || toCents(amount) < 1}>{pending ? "Refunding..." : "Refund"}</button>
        </form>
      )}
      <Note msg={msg} />
    </div>
  );
}

export function FeeTypeForm({ fee }: { fee?: Fee & { description: string | null; active: boolean } }) {
  const router = useRouter();
  const [v, setV] = useState({
    name: fee?.name ?? "", kind: fee?.kind ?? "fixed", amount: fee?.default_cents != null ? String(fee.default_cents / 100) : "",
    percent: fee?.default_percent != null ? String(fee.default_percent) : "", description: fee?.description ?? "", active: fee?.active ?? true,
  });
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const save = () => start(async () => {
    setMsg(null);
    const r = await saveFeeType({ id: fee?.id, name: v.name, kind: v.kind as "fixed" | "percent", defaultCents: v.amount ? toCents(v.amount) : null, defaultPercent: v.percent ? Number(v.percent) : null, description: v.description, active: v.active });
    setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) { if (!fee) setV({ name: "", kind: "fixed", amount: "", percent: "", description: "", active: true }); router.refresh(); }
  });
  return (
    <form className="afee" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label className="field"><span>Name</span><input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} maxLength={80} required /></label>
      <label className="field"><span>Type</span><select value={v.kind} onChange={(e) => setV({ ...v, kind: e.target.value })}><option value="fixed">Fixed amount</option><option value="percent">% of yearly salary</option></select></label>
      {v.kind === "fixed"
        ? <label className="field"><span>Usual amount (USD)</span><input inputMode="decimal" value={v.amount} onChange={(e) => setV({ ...v, amount: e.target.value })} placeholder="Optional" /></label>
        : <label className="field"><span>Usual percent</span><input inputMode="decimal" value={v.percent} onChange={(e) => setV({ ...v, percent: e.target.value })} placeholder="15" /></label>}
      <label className="field afee__desc"><span>Description</span><input value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} maxLength={300} /></label>
      <label className="chip-check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> In use</label>
      <div className="afee__foot"><Note msg={msg} /><button className="btn btn--ghost btn--sm" disabled={pending}>{fee ? "Save" : "Add fee"}</button></div>
    </form>
  );
}
