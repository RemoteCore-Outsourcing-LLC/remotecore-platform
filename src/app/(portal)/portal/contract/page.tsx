import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { activeContract, fillContract, today } from "@/lib/contracts";
import { safeNext } from "@/lib/safe-next";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";
import { SignContract } from "@/components/portal/ContractClient";

export const metadata: Metadata = { title: "Agreement", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function ContractPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const [t, sigs] = await Promise.all([
    activeContract(),
    sb.from("contract_signatures").select("id, template_id, title, signer_name, signed_at").eq("company_id", company.id).order("signed_at", { ascending: false }),
  ]);
  const signed = (sigs.data ?? []) as { id: string; template_id: string | null; title: string; signer_name: string; signed_at: string }[];
  const mustSign = t && !signed.some((s) => s.template_id === t.id);
  const back = next ? safeNext(next) : null;
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Service agreement" sub={mustSign ? "Please read and sign before your first payment. You get a copy by email." : "Your signed agreements with RemoteCore."} />
      {mustSign && t && (
        <article className="jobdoc contract">
          <header className="jobdoc__head"><h2>{t.title}</h2></header>
          <div className="jobdoc__body">
            <div className="contract__text prose">{fillContract(t.body, { client_name: company.contact_person, client_email: company.email, company_name: company.name, company_country: company.country ?? "", date: today() })}</div>
            <SignContract templateId={t.id} defaultName={company.contact_person} next={back} />
          </div>
        </article>
      )}
      <section className="panel" aria-labelledby="sig-h">
        <header className="panel__head"><h2 id="sig-h">Signed copies</h2></header>
        {signed.length === 0 ? <Empty title="Nothing signed yet" /> : (
          <ul className="rows">
            {signed.map((s) => (
              <li key={s.id}><a className="rows__title" href={`/portal/contract/${s.id}`}>{s.title}</a><span className="soft small">Signed by {s.signer_name} · <LocalTime iso={s.signed_at} /></span></li>
            ))}
          </ul>
        )}
      </section>
      {!mustSign && back && <p><a className="btn btn--main" href={back}>Continue to payment</a></p>}
    </div>
  );
}
