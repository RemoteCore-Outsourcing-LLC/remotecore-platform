import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, recordCheckout, syncRefund } from "@/lib/billing";

// Stripe calls this after a payment or refund, even if the payer closed the page before coming back.
// Every event is checked with the signing secret, so nobody else can fake a payment.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Not set up" }, { status: 503 });
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Bad signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordCheckout((event.data.object as Stripe.Checkout.Session).id);
  } else if (event.type === "refund.created" || event.type === "refund.updated") {
    const r = event.data.object as Stripe.Refund;
    if (r.metadata?.invoice_id) await syncRefund(r, r.metadata.invoice_id);
  }
  return NextResponse.json({ received: true });
}
