import "server-only";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "@/lib/email/send";
import { paymentReceived, newPaymentAdmin } from "@/lib/email/templates";

// Stripe for invoices, card payments and refunds. The key decides the account: a test sandbox while we build,
// RemoteCore's own account after launch. Only this server file talks to Stripe.
let client: Stripe | null = null;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is missing");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";

export const INVOICE_STATUS: Record<string, { label: string; tone: string }> = {
  draft: { label: "Draft", tone: "neutral" }, open: { label: "To pay", tone: "info" }, paid: { label: "Paid", tone: "good" },
  void: { label: "Cancelled", tone: "bad" }, refunded: { label: "Refunded", tone: "bad" }, partially_refunded: { label: "Part refunded", tone: "info" },
};
export function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

// A Stripe Checkout page for one open invoice. The card details never touch our server.
export async function checkoutFor(invoiceId: string) {
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("id, number, status, currency, description, companies(email, name), invoice_items(description, amount_cents)").eq("id", invoiceId).single();
  if (!inv || inv.status !== "open") return null;
  const co = inv.companies as unknown as { email: string; name: string };
  const items = (inv.invoice_items as { description: string; amount_cents: number }[]).filter((i) => i.amount_cents > 0);
  const session = await stripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"], // card only, as the brief asks (no buy now pay later, no bank debits)
    customer_email: co.email,
    line_items: items.map((i) => ({ quantity: 1, price_data: { currency: inv.currency, unit_amount: i.amount_cents, product_data: { name: `${inv.number}: ${i.description}`.slice(0, 250) } } })),
    metadata: { invoice_id: inv.id, invoice_number: inv.number },
    payment_intent_data: { metadata: { invoice_id: inv.id, invoice_number: inv.number }, description: `${inv.number} ${co.name}`.slice(0, 200) },
    success_url: `${SITE()}/portal/billing/${inv.id}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE()}/portal/billing/${inv.id}`,
  }, { idempotencyKey: `checkout-${inv.id}-${Math.floor(Date.now() / 60000)}` });
  await db.from("invoices").update({ stripe_session_id: session.id, updated_at: new Date().toISOString() }).eq("id", inv.id);
  return session.url;
}

// Records a finished Checkout once (the return page and the webhook may both call this). Sends the receipts.
export async function recordCheckout(sessionId: string) {
  const s = await stripe().checkout.sessions.retrieve(sessionId, { expand: ["payment_intent.latest_charge"] });
  const invoiceId = s.metadata?.invoice_id;
  if (!invoiceId || s.payment_status !== "paid") return { paid: false };
  const pi = s.payment_intent as Stripe.PaymentIntent;
  const charge = pi.latest_charge as Stripe.Charge | null;
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("id, number, company_id, currency, amount_cents, description, status, companies(email, contact_person, name)").eq("id", invoiceId).single();
  if (!inv) return { paid: false };
  const { error: dup } = await db.from("payments").insert({ invoice_id: inv.id, company_id: inv.company_id, type: "payment", amount_cents: s.amount_total ?? inv.amount_cents, currency: s.currency ?? inv.currency, stripe_id: pi.id });
  if (dup) return { paid: true }; // already recorded
  const at = new Date().toISOString();
  await db.from("invoices").update({ status: "paid", paid_at: at, stripe_payment_intent: pi.id, receipt_url: charge?.receipt_url ?? null, updated_at: at }).eq("id", inv.id);
  const co = inv.companies as unknown as { email: string; contact_person: string; name: string };
  const team = adminEmails();
  await Promise.allSettled([
    sendEmail({ to: co.email, ...paymentReceived({ name: co.contact_person, amountCents: s.amount_total ?? inv.amount_cents, currency: inv.currency, description: `${inv.number}, ${inv.description}`, at, receiptUrl: charge?.receipt_url ?? undefined }) }),
    team.length ? sendEmail({ to: team, ...newPaymentAdmin({ company: co.name, amountCents: s.amount_total ?? inv.amount_cents, currency: inv.currency, description: `${inv.number}, ${inv.description}` }) }) : null,
  ]);
  return { paid: true };
}

// Refund part or all of a paid invoice. Stripe returns the money to the same card.
export async function refundInvoice(invoiceId: string, cents: number, actorId: string) {
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("id, company_id, currency, amount_cents, refunded_cents, status, stripe_payment_intent").eq("id", invoiceId).single();
  if (!inv?.stripe_payment_intent || !["paid", "partially_refunded"].includes(inv.status)) return { ok: false, message: "Only a paid invoice can be refunded." };
  const left = inv.amount_cents - inv.refunded_cents;
  if (!Number.isInteger(cents) || cents < 1 || cents > left) return { ok: false, message: `You can refund up to ${money(left, inv.currency)}.` };
  const r = await stripe().refunds.create({ payment_intent: inv.stripe_payment_intent, amount: cents, metadata: { invoice_id: inv.id, by: actorId } }, { idempotencyKey: `refund-${inv.id}-${inv.refunded_cents}-${cents}` });
  await syncRefund(r, inv.id);
  return { ok: true };
}

// Saves one Stripe refund once and updates the invoice. Called after a refund and from the webhook.
export async function syncRefund(r: Stripe.Refund, invoiceId: string) {
  if (r.status === "failed" || r.status === "canceled") return;
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("id, company_id, currency, amount_cents").eq("id", invoiceId).single();
  if (!inv) return;
  const { error: dup } = await db.from("payments").insert({ invoice_id: inv.id, company_id: inv.company_id, type: "refund", amount_cents: r.amount, currency: r.currency, stripe_id: r.id });
  if (dup) return;
  const { data: all } = await db.from("payments").select("amount_cents").eq("invoice_id", inv.id).eq("type", "refund");
  const refunded = (all ?? []).reduce((n, p) => n + p.amount_cents, 0);
  await db.from("invoices").update({ refunded_cents: refunded, status: refunded >= inv.amount_cents ? "refunded" : "partially_refunded", updated_at: new Date().toISOString() }).eq("id", inv.id);
}
