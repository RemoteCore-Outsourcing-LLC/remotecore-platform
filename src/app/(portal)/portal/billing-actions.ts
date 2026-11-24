"use server";
import { supabaseServer } from "@/lib/supabase/server";
import { checkoutFor } from "@/lib/billing";
import { needsSignature } from "@/lib/contracts";

// The employer pays one of their open invoices on a Stripe Checkout page.
export async function payInvoice(id: string): Promise<{ ok: boolean; url?: string; message?: string }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Please log in again." };
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, message: "Unknown invoice." };
  // Row level security only returns the employer's own, non draft invoices.
  const { data: inv } = await sb.from("invoices").select("id, status").eq("id", id).maybeSingle();
  if (!inv) return { ok: false, message: "We could not find this invoice." };
  if (inv.status !== "open") return { ok: false, message: inv.status === "paid" ? "This invoice is already paid." : "This invoice can not be paid any more." };
  // The current service agreement must be signed before any payment.
  const { data: co } = await sb.from("companies").select("id").eq("owner_id", user.id).maybeSingle();
  if (co && (await needsSignature(co.id))) return { ok: false, message: "Please sign the service agreement first.", url: `/portal/contract?next=/portal/billing/${inv.id}` };
  try {
    const url = await checkoutFor(inv.id);
    return url ? { ok: true, url } : { ok: false, message: "This invoice can not be paid any more." };
  } catch {
    return { ok: false, message: "The payment page did not open. Please try again in a minute." };
  }
}
