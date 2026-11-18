import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { INVOICE_STATUS, money } from "@/lib/billing";
import { shortDate } from "@/lib/portal/seeker";
import { PageHead } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { InvoiceActions } from "@/components/portal/BillingClient";

export const metadata: Metadata = { title: "Invoice", robots: { index: false } };

export default async function AdminInvoice({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ made?: string }> }) {
  const { id } = await params;
  const { made } = await searchParams;
  const { sb, admin } = await getAdmin();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [{ data: inv }, { data: pays }] = await Promise.all([
    sb.from("invoices").select("*, companies(name, email, owner_id), invoice_items(id, description, amount_cents)").eq("id", id).maybeSingle(),
    sb.from("payments").select("id, type, amount_cents, currency, created_at, stripe_id").eq("invoice_id", id).order("created_at"),
  ]);
  if (!inv) notFound();
  const co = inv.companies as { name: string; email: string; owner_id: string };
  const s = INVOICE_STATUS[inv.status];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/admin/billing">Billing</a></p>
      {made && <p className="notice notice--ok" role="status">{made === "sent" ? "Invoice sent. The employer got an email with a link to pay." : "Saved as a draft. Send it when it is ready."}</p>}
      <PageHead title={`Invoice ${inv.number}`} sub={`${co.name} · ${inv.description}`} aside={<span className={`pill pill--${s?.tone ?? "neutral"}`}>{s?.label ?? inv.status}</span>} />
      <section className="panel cside" style={{ marginBottom: 20 }}>
        <header className="panel__head"><h2>Actions</h2><a href={`/portal/admin/users/${co.owner_id}`}>Company account</a></header>
        <div className="cside__body"><InvoiceActions id={inv.id} status={inv.status} leftCents={inv.amount_cents - inv.refunded_cents} currency={inv.currency} /></div>
      </section>
      <article className="jobdoc">
        <div className="jobdoc__body">
          <dl className="facts">
            <dt>Company</dt><dd>{co.name} ({co.email})</dd>
            <dt>Made</dt><dd><LocalTime iso={inv.created_at} /></dd>
            {inv.sent_at && <><dt>Sent</dt><dd><LocalTime iso={inv.sent_at} /></dd></>}
            {inv.due_date && <><dt>Due</dt><dd>{shortDate(inv.due_date)}</dd></>}
            {inv.paid_at && <><dt>Paid</dt><dd><LocalTime iso={inv.paid_at} /></dd></>}
            {inv.stripe_payment_intent && <><dt>Stripe payment</dt><dd className="small">{inv.stripe_payment_intent}</dd></>}
          </dl>
          <table className="ntable invoice__lines">
            <thead><tr><th scope="col">Line</th><th scope="col">Amount</th></tr></thead>
            <tbody>{(inv.invoice_items as { id: number; description: string; amount_cents: number }[]).map((i) => <tr key={i.id}><th scope="row">{i.description}</th><td>{money(i.amount_cents, inv.currency)}</td></tr>)}</tbody>
            <tfoot><tr><th scope="row">Total</th><td><b>{money(inv.amount_cents, inv.currency)}</b></td></tr>
              {inv.refunded_cents > 0 && <tr><th scope="row">Refunded</th><td>-{money(inv.refunded_cents, inv.currency)}</td></tr>}</tfoot>
          </table>
          {inv.note && <p className="prose small">{inv.note}</p>}
          {(pays ?? []).length > 0 && (
            <section aria-labelledby="h-pay"><h2 id="h-pay">Payments and refunds</h2>
              <ul className="alist">{(pays ?? []).map((p) => <li key={p.id}><span>{p.type === "refund" ? "Refund" : "Card payment"} {p.type === "refund" ? "-" : ""}{money(p.amount_cents, p.currency)}</span><span className="soft small"><LocalTime iso={p.created_at} /></span></li>)}</ul>
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
