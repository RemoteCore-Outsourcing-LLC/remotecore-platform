"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signContract } from "@/app/(portal)/portal/contract/actions";

export function SignContract({ templateId, defaultName, next }: { templateId: string; defaultName: string; next: string | null }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [agree, setAgree] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const sign = () => start(async () => {
    setMsg(null);
    const r = await signContract(templateId, name, agree);
    if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); return; }
    setMsg({ ok: true, text: "Signed. We emailed you a copy." });
    if (next) location.href = next; else router.refresh();
  });
  return (
    <form className="contract__sign stack" onSubmit={(e) => { e.preventDefault(); sign(); }}>
      <label className="field"><span>Type your full name to sign</span><input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={120} required /></label>
      <label className="chip-check"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> I have read this agreement and I agree to it for my company.</label>
      <div className="aact__row">
        <button className="btn btn--main" disabled={pending || !agree}>{pending ? "Signing..." : next ? "Sign and continue to payment" : "Sign the agreement"}</button>
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
      </div>
    </form>
  );
}

export function ContractDoc({ c }: { c: { title: string; body: string; signer_name: string; signer_email: string; company_name: string; signed_at: string } }) {
  return (
    <article className="jobdoc contract">
      <header className="jobdoc__head">
        <h1>{c.title}</h1>
        <p className="soft small">Signed by <b>{c.signer_name}</b> ({c.signer_email}) for {c.company_name}, {new Date(c.signed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</p>
      </header>
      <div className="jobdoc__body">
        <div className="contract__text prose">{c.body}</div>
        <p><button type="button" className="btn btn--ghost btn--sm" onClick={() => window.print()}>Print or save as PDF</button></p>
      </div>
    </article>
  );
}
