import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { PLACEHOLDERS } from "@/lib/contracts";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { ContractEditor, ContractRowButtons } from "@/components/portal/ContractAdmin";

export const metadata: Metadata = { title: "Contracts", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminContracts({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const { edit } = await searchParams;
  const [tpl, sigs] = await Promise.all([
    sb.from("contract_templates").select("id, title, body, active, created_at").order("created_at", { ascending: false }),
    sb.from("contract_signatures").select("id, title, signer_name, company_name, signed_at").order("signed_at", { ascending: false }).limit(300),
  ]);
  const templates = (tpl.data ?? []) as { id: string; title: string; body: string; active: boolean; created_at: string }[];
  const editing = edit === "new" ? { id: null, title: "", body: "" } : templates.find((t) => t.id === edit) ?? null;
  const signed = (sigs.data ?? []) as { id: string; title: string; signer_name: string; company_name: string; signed_at: string }[];
  return (
    <div className="pwrap">
      <PageHead title="Contracts" sub="Write your service agreement once. Each employer reads it with their own name and company filled in, signs it before their first payment, and you both get a copy by email." aside={<a className="btn btn--main btn--sm" href="/portal/admin/contracts?edit=new">New agreement</a>} />
      {editing && (
        <section className="panel" aria-labelledby="ed-h">
          <header className="panel__head"><h2 id="ed-h">{editing.id ? "Edit agreement" : "New agreement"}</h2></header>
          <div className="psec__body">
            <ContractEditor initial={editing} blanks={PLACEHOLDERS} />
          </div>
        </section>
      )}
      <section className="panel" aria-labelledby="tp-h">
        <header className="panel__head"><h2 id="tp-h">Your agreements</h2></header>
        {templates.length === 0 ? <Empty title="No agreement yet">Until you add one and turn it on, employers pay without signing.</Empty> : (
          <ul className="rows crows">
            {templates.map((t) => (
              <li key={t.id}>
                <div className="crows__who"><b className="rows__title">{t.title}</b><span className="soft small">Added <LocalTime iso={t.created_at} /></span></div>
                <span className={`pill ${t.active ? "pill--good" : ""}`}>{t.active ? "In use" : "Not in use"}</span>
                <ContractRowButtons id={t.id} active={t.active} />
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel" aria-labelledby="sg-h">
        <header className="panel__head"><h2 id="sg-h">Signed</h2><span className="pill">{signed.length}</span></header>
        {signed.length === 0 ? <Empty title="Nothing signed yet" /> : (
          <ul className="rows">
            {signed.map((s) => <li key={s.id}><a className="rows__title" href={`/portal/contract/${s.id}`}>{s.company_name}</a><span className="soft small">{s.title} · {s.signer_name} · <LocalTime iso={s.signed_at} /></span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
