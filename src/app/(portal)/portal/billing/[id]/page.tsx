import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { INVOICE_STATUS, money, recordCheckout } from "@/lib/billing";
import { shortDate } from "@/lib/portal/seeker";
import { company as RC } from "@/lib/site";
import { PageHead } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";
import { PayButton } from "@/components/portal/BillingClient";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function Invoice({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ session_id?: string }> }) {
  const { id } = await params;
  const { session_id } = await searchParams;
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  // Back from Stripe: confirm the payment with Stripe itself (the webhook does the same, whichever comes first).
  let justPaid = false;
  if (session_id && /^cs_[A-Za-z0-9_]+$/.test(session_id)) {
    const { data: own } = await sb.from("invoices").select("stripe_session_id").eq("id", id).maybeSingle();
    if (own?.stripe_session_id === session_id) justPaid = (await recordCheckout(session_id).catch(() => ({ paid: false }))).paid;
  }
  const { data: inv } = await sb.from("invoices").select("id, number, status, description, note, amount_cents, refunded_cents, currency, due_date, sent_at, paid_at, receipt_url, invoice_items(id, description, amount_cents)").eq("id", id).maybeSingle();
  if (!inv) notFound();
  const s = INVOICE_STATUS[inv.status];
  const items = (inv.invoice_items ?? []) as { id: number; description: string; amount_cents: number }[];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/billing">All invoices</a></p>
      {justPaid && <p className="notice notice--ok" role="status">Thank you. Your payment went through and we emailed you a receipt.</p>}
      <PageHead title={`Invoice ${inv.number}`} sub={inv.description} aside={<span className={`pill pill--${s?.tone ?? "neutral"}`}>{s?.label ?? inv.status}</span>} />
      <article className="jobdoc invoice">
        <header className="jobdoc__head invoice__head">
          <div><b>{RC.name}</b><span className="soft small">{RC.address.join(", ")}</span></div>
          <div className="invoice__to"><span className="soft small">Billed to</span><b>{company.name}</b><span className="soft small">{company.email}</span></div>
        </header>
        <div className="jobdoc__body">
          <dl className="facts">
            {inv.sent_at && <><dt>Sent</dt><dd><LocalTime iso={inv.sent_at} /></dd></>}
            {inv.due_date && <><dt>Due</dt><dd>{shortDate(inv.due_date)}</dd></>}
            {inv.paid_at && <><dt>Paid</dt><dd><LocalTime iso={inv.paid_at} /></dd></>}
          </dl>
          <table className="ntable invoice__lines">
            <thead><tr><th scope="col">Description</th><th scope="col">Amount</th></tr></thead>
            <tbody>{items.map((i) => <tr key={i.id}><th scope="row">{i.description}</th><td>{money(i.amount_cents, inv.currency)}</td></tr>)}</tbody>
            <tfoot>
              <tr><th scope="row">Total</th><td><b>{money(inv.amount_cents, inv.currency)}</b></td></tr>
              {inv.refunded_cents > 0 && <tr><th scope="row">Refunded to your card</th><td>-{money(inv.refunded_cents, inv.currency)}</td></tr>}
            </tfoot>
          </table>
          {inv.note && <p className="prose small">{inv.note}</p>}
          <div className="aact__row">
            {inv.status === "open" && <PayButton id={inv.id} label={`Pay ${money(inv.amount_cents, inv.currency)} by card`} />}
            {inv.receipt_url && <a className="btn btn--ghost btn--sm" href={inv.receipt_url} target="_blank" rel="noopener noreferrer">Card receipt</a>}
          </div>
          {inv.status === "open" && <p className="soft small">You pay on a secure Stripe page. RemoteCore never sees your card number.</p>}
        </div>
      </article>
    </div>
  );
}
