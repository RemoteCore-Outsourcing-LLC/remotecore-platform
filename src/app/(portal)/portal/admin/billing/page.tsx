import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { INVOICE_STATUS, money } from "@/lib/billing";
import { shortDate } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { FeeTypeForm } from "@/components/portal/BillingClient";

export const metadata: Metadata = { title: "Billing", robots: { index: false } };

type Inv = { id: string; number: string; status: string; description: string; amount_cents: number; refunded_cents: number; currency: string; due_date: string | null; created_at: string; companies: { name: string } | null };

// Invoices, every payment and refund, money in by month, and the fee types the team bills with.
export default async function AdminBilling({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const tab = ["invoices", "payments", "fees"].includes(sp.tab ?? "") ? sp.tab! : "invoices";
  const [{ data: inv }, { data: pays }, { data: fees }] = await Promise.all([
    sb.from("invoices").select("id, number, status, description, amount_cents, refunded_cents, currency, due_date, created_at, companies(name)").order("created_at", { ascending: false }).limit(1000),
    sb.from("payments").select("id, type, amount_cents, currency, created_at, invoice_id, invoices(number), companies(name)").order("created_at", { ascending: false }).limit(2000),
    sb.from("fee_types").select("*").order("sort").order("id"),
  ]);
  const invoices = (inv ?? []) as unknown as Inv[];
  const st = sp.status && INVOICE_STATUS[sp.status] ? sp.status : "";
  const shown = st ? invoices.filter((i) => i.status === st) : invoices;
  const openTotal = invoices.filter((i) => i.status === "open").reduce((n, i) => n + i.amount_cents, 0);

  // Money in by month (payments minus refunds), in USD only; other currencies are listed apart.
  const months = new Map<string, { in: number; out: number }>();
  for (const p of pays ?? []) {
    if (p.currency !== "usd") continue;
    const k = p.created_at.slice(0, 7);
    const m = months.get(k) ?? { in: 0, out: 0 };
    if (p.type === "payment") m.in += p.amount_cents; else m.out += p.amount_cents;
    months.set(k, m);
  }
  const monthRows = [...months.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <div className="pwrap">
      <PageHead title="Billing" sub="Invoices to employers, card payments and refunds. Employers pay on a secure Stripe page." aside={<a className="btn btn--main btn--sm" href="/portal/admin/billing/new">Make an invoice</a>} />
      <ul className="tally" aria-label="Summary">
        <li><a href="/portal/admin/billing?status=open"><b>{money(openTotal)}</b> waiting to be paid</a></li>
        <li><a href="/portal/admin/billing?tab=payments"><b>{money(monthRows[0]?.[0] === new Date().toISOString().slice(0, 7) ? monthRows[0][1].in - monthRows[0][1].out : 0)}</b> in this month</a></li>
      </ul>
      <nav className="seg seg--tabs" aria-label="Billing">
        {[["invoices", "Invoices"], ["payments", "Payments and report"], ["fees", "Fee types"]].map(([k, l]) => <a key={k} href={`/portal/admin/billing?tab=${k}`} aria-current={tab === k ? "page" : undefined}>{l}</a>)}
      </nav>
      {tab === "invoices" && (
        <>
          <nav className="seg" aria-label="Filter by status" style={{ marginBottom: 12 }}>
            <a href="/portal/admin/billing" aria-current={!st ? "page" : undefined}>All <b>{invoices.length}</b></a>
            {Object.entries(INVOICE_STATUS).map(([k, s]) => { const n = invoices.filter((i) => i.status === k).length; return n || k === st ? <a key={k} href={`/portal/admin/billing?status=${k}`} aria-current={st === k ? "page" : undefined}>{s.label} <b>{n}</b></a> : null; })}
          </nav>
          <section className="panel" aria-label="Invoices">
            {shown.length === 0 ? <Empty title="No invoices yet" action={<a className="btn btn--main btn--sm" href="/portal/admin/billing/new">Make an invoice</a>}>Make an invoice for a placement fee, a deposit or any other service.</Empty> : (
              <ul className="rows crows">
                {shown.map((i) => (
                  <li key={i.id}>
                    <div className="crows__who"><a className="rows__title" href={`/portal/admin/billing/${i.id}`}>{i.number}: {i.companies?.name}</a><span className="soft small">{i.description}{i.due_date ? ` · Due ${shortDate(i.due_date)}` : ""}</span></div>
                    <b className="nowrap">{money(i.amount_cents, i.currency)}</b>
                    <span className={`pill pill--${INVOICE_STATUS[i.status]?.tone ?? "neutral"}`}>{INVOICE_STATUS[i.status]?.label ?? i.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
      {tab === "payments" && (
        <div className="stack">
          <section className="panel" aria-labelledby="rep-h">
            <header className="panel__head"><h2 id="rep-h">Money in by month (USD)</h2></header>
            {monthRows.length === 0 ? <Empty title="No payments yet">Payments show up here as soon as an employer pays.</Empty> : (
              <div className="tscroll"><table className="ntable">
                <thead><tr><th scope="col">Month</th><th scope="col">Payments</th><th scope="col">Refunds</th><th scope="col">Money in</th></tr></thead>
                <tbody>{monthRows.map(([k, m]) => <tr key={k}><th scope="row">{new Date(`${k}-01T00:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</th><td>{money(m.in)}</td><td>{m.out ? `-${money(m.out)}` : money(0)}</td><td><b>{money(m.in - m.out)}</b></td></tr>)}</tbody>
              </table></div>
            )}
          </section>
          <section className="panel" aria-labelledby="tx-h">
            <header className="panel__head"><h2 id="tx-h">Every payment and refund</h2></header>
            {(pays ?? []).length === 0 ? <Empty title="Nothing yet" /> : (
              <div className="tscroll"><table className="ntable">
                <thead><tr><th scope="col">Date</th><th scope="col">Company</th><th scope="col">Invoice</th><th scope="col">Type</th><th scope="col">Amount</th></tr></thead>
                <tbody>{(pays ?? []).map((p) => <tr key={p.id}><th scope="row"><LocalTime iso={p.created_at} /></th><td>{(p.companies as unknown as { name: string } | null)?.name}</td><td><a href={`/portal/admin/billing/${p.invoice_id}`}>{(p.invoices as unknown as { number: string } | null)?.number}</a></td><td>{p.type === "refund" ? "Refund" : "Payment"}</td><td>{p.type === "refund" ? "-" : ""}{money(p.amount_cents, p.currency)}</td></tr>)}</tbody>
              </table></div>
            )}
          </section>
        </div>
      )}
      {tab === "fees" && (
        <section className="panel" aria-labelledby="fee-h">
          <header className="panel__head"><h2 id="fee-h">Fee types</h2></header>
          <p className="psec__intro" style={{ padding: "0 22px 12px" }}>The fees you pick from when you make an invoice. A usual amount or percent fills in by itself, and you can still change it on each invoice.</p>
          <ul className="afees">
            {(fees ?? []).map((f) => <li key={f.id}><FeeTypeForm fee={f} /></li>)}
            <li className="afees__new"><h3 className="small">Add a fee type</h3><FeeTypeForm /></li>
          </ul>
        </section>
      )}
    </div>
  );
}
