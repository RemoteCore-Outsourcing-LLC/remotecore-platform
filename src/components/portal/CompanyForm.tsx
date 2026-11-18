"use client";
import { useState, useTransition } from "react";
import { updateCompany } from "@/app/(portal)/portal/actions";
import { COUNTRIES } from "@/lib/geo";
import { INDUSTRIES } from "@/lib/employer";
import type { Company } from "./Employer";

export function CompanyForm({ c }: { c: Company }) {
  const [v, setV] = useState({
    name: c.name, contact_person: c.contact_person, phone: c.phone ?? "", country: c.country ?? "",
    website: c.website ?? "", industry: c.industry ?? "", description: c.description ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setV({ ...v, [k]: e.target.value }); setMsg(null); };
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    start(async () => {
      const r = await updateCompany(v);
      setErrors(r.errors ?? {});
      setMsg(r.ok ? { ok: true, text: "Saved" } : { ok: false, text: r.message ?? "Please check the fields marked in red." });
    });
  };
  const fe = (k: string) => errors[k] && <span className="ferr">{errors[k]}</span>;
  const industries = v.industry && !INDUSTRIES.includes(v.industry) ? [v.industry, ...INDUSTRIES] : INDUSTRIES;
  return (
    <form className="psec__body" onSubmit={save} noValidate>
      <div className="pgrid">
        <label className="field"><span>Company name</span><input value={v.name} onChange={set("name")} autoComplete="organization" aria-invalid={!!errors.name} />{fe("name")}</label>
        <label className="field"><span>Contact person</span><input value={v.contact_person} onChange={set("contact_person")} autoComplete="name" aria-invalid={!!errors.contact_person} />{fe("contact_person")}</label>
        <label className="field"><span>Business email</span><input value={c.email} disabled /><em className="hint">To change it, contact RemoteCore.</em></label>
        <label className="field"><span>Business phone</span><input value={v.phone} onChange={set("phone")} type="tel" autoComplete="tel" aria-invalid={!!errors.phone} />{fe("phone")}</label>
        <label className="field"><span>Country of registration or operation</span>
          <select value={v.country} onChange={set("country")}><option value="">Choose a country</option>{COUNTRIES.map((x) => <option key={x.code}>{x.name}</option>)}</select>
        </label>
        <label className="field"><span>Industry or business sector</span>
          <select value={v.industry} onChange={set("industry")}><option value="">Choose an industry</option>{industries.map((i) => <option key={i}>{i}</option>)}</select>
        </label>
        <label className="field field--wide"><span>Company website <em className="hint">optional</em></span><input value={v.website} onChange={set("website")} inputMode="url" placeholder="yourcompany.com" aria-invalid={!!errors.website} />{fe("website")}</label>
        <label className="field field--wide"><span>About your company</span><textarea rows={5} value={v.description} onChange={set("description")} maxLength={2000} aria-invalid={!!errors.description} />{fe("description")}</label>
      </div>
      <div className="formfoot">
        {msg && (msg.ok ? <span className="saved" role="status">{msg.text}</span> : <span className="ferr" role="alert">{msg.text}</span>)}
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : "Save changes"}</button>
      </div>
    </form>
  );
}
