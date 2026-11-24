import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { INVOICE_STATUS, money } from "@/lib/billing";
import { shortDate } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";

export const metadata: Metadata = { title: "Invoices and payments", robots: { index: false } };

// The employer's invoices from RemoteCore and every payment and refund on their account.
export default async function Billing() {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    sb.from("invoices").select("id, number, status, description, amount_cents, refunded_cents, currency, due_date, sent_at, paid_at").order("created_at", { ascending: false }),
    sb.from("payments").select("id, type, amount_cents, currency, created_at, invoices(number)").order("created_at", { ascending: false }).limit(100),
  ]);
  const list = invoices ?? [];
  const open = list.filter((i) => i.status === "open");
  const due = open.reduce((n, i) => n + i.amount_cents, 0);
  return (
    <div className="pwrap">
      <PageHead title="Invoices and payments" sub="Your invoices from RemoteCore and the payments you made. Pay any open invoice by card." aside={<a className="btn btn--ghost btn--sm" href="/portal/contract">Service agreement</a>} />
      {open.length > 0 && <p className="notice" role="status">{open.length} {open.length === 1 ? "invoice is" : "invoices are"} waiting for payment, {money(due, open[0].currency)} in total.</p>}
      <section className="panel" aria-labelledby="inv-h">
        <header className="panel__head"><h2 id="inv-h">Invoices</h2></header>
        {list.length === 0 ? <Empty title="No invoices yet">When RemoteCore sends you an invoice, it shows up here and in your email, and you can pay it by card.</Empty> : (
          <ul className="rows crows">
            {list.map((i) => {
              const s = INVOICE_STATUS[i.status];
              return (
                <li key={i.id}>
                  <div className="crows__who"><a className="rows__title" href={`/portal/billing/${i.id}`}>{i.number}: {i.description}</a><span className="soft small">{i.paid_at ? <>Paid <LocalTime iso={i.paid_at} /></> : i.due_date ? `Due ${shortDate(i.due_date)}` : i.sent_at ? <>Sent <LocalTime iso={i.sent_at} /></> : ""}</span></div>
                  <b className="nowrap">{money(i.amount_cents, i.currency)}</b>
                  <span className={`pill pill--${s?.tone ?? "neutral"}`}>{s?.label ?? i.status}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="panel" aria-labelledby="pay-h" style={{ marginTop: 20 }}>
        <header className="panel__head"><h2 id="pay-h">Payment history</h2></header>
        {(payments ?? []).length === 0 ? <Empty title="No payments yet">Every card payment and refund shows up here.</Empty> : (
          <div className="tscroll">
            <table className="ntable">
              <thead><tr><th scope="col">Date</th><th scope="col">Invoice</th><th scope="col">Type</th><th scope="col">Amount</th></tr></thead>
              <tbody>{(payments ?? []).map((p) => <tr key={p.id}><th scope="row"><LocalTime iso={p.created_at} /></th><td>{(p.invoices as unknown as { number: string } | null)?.number}</td><td>{p.type === "refund" ? "Refund to your card" : "Card payment"}</td><td>{p.type === "refund" ? "-" : ""}{money(p.amount_cents, p.currency)}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
