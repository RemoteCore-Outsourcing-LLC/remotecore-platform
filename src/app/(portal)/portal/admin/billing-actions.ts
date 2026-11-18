"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { refundInvoice as stripeRefund } from "@/lib/billing";
import { sendEmail } from "@/lib/email/send";
import { invoiceReady } from "@/lib/email/templates";

type Result = { ok: boolean; message?: string; id?: string };
const UUID = /^[0-9a-f-]{36}$/i;
const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";

async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabaseAdmin().from("profiles").select("id, role, status").eq("id", user.id).single();
  if (!me || me.role !== "admin" || me.status !== "active") return null;
  return { me };
}
const log = (actorId: string, action: string, target: string, details: Record<string, unknown>) =>
  supabaseAdmin().from("admin_log").insert({ actor_id: actorId, action, target, details });
const refresh = () => { revalidatePath("/portal", "layout"); };

const invoiceSchema = z.object({
  companyId: z.string().regex(UUID, "Choose the company."),
  description: z.string().trim().min(2, "Say what the invoice is for.").max(200),
  dueDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
  note: z.string().trim().max(1000),
  currency: z.string().regex(/^[a-z]{3}$/),
  items: z.array(z.object({
    feeTypeId: z.number().int().positive().nullable(),
    description: z.string().trim().min(1, "Every line needs a description.").max(200),
    amountCents: z.number().int().min(0).max(100_000_000),
  })).min(1, "Add at least one line.").max(20),
});
export type InvoiceInput = z.input<typeof invoiceSchema>;

// Make an invoice. "send" opens it for payment and emails the employer a pay link.
export async function createInvoice(input: InvoiceInput, send: boolean): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const p = invoiceSchema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Please check the invoice." };
  const total = p.data.items.reduce((n, i) => n + i.amountCents, 0);
  if (total < 50) return { ok: false, message: "The total must be at least 0.50." };
  const db = supabaseAdmin();
  const { data: co } = await db.from("companies").select("id, status").eq("id", p.data.companyId).maybeSingle();
  if (!co) return { ok: false, message: "We could not find this company." };
  const { data: inv, error } = await db.from("invoices").insert({
    company_id: co.id, created_by: a.me.id, description: p.data.description, note: p.data.note || null,
    due_date: p.data.dueDate || null, currency: p.data.currency, amount_cents: total,
  }).select("id, number").single();
  if (error || !inv) return { ok: false, message: "We could not save the invoice. Please try again." };
  const { error: itemErr } = await db.from("invoice_items").insert(p.data.items.map((i) => ({ invoice_id: inv.id, fee_type_id: i.feeTypeId, description: i.description, amount_cents: i.amountCents })));
  if (itemErr) { await db.from("invoices").delete().eq("id", inv.id); return { ok: false, message: "We could not save the invoice lines. Please try again." }; }
  await log(a.me.id, "invoice_created", inv.id, { number: inv.number, total });
  if (send) { const r = await sendInvoice(inv.id); if (!r.ok) return { ...r, id: inv.id }; }
  refresh();
  return { ok: true, id: inv.id };
}

// Open a draft invoice for payment and email the employer.
export async function sendInvoice(id: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Unknown invoice." };
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("id, number, status, amount_cents, currency, description, due_date, companies(owner_id, email, contact_person, status)").eq("id", id).single();
  if (!inv) return { ok: false, message: "Unknown invoice." };
  if (!["draft", "open"].includes(inv.status)) return { ok: false, message: "This invoice is already paid or cancelled." };
  const co = inv.companies as unknown as { owner_id: string; email: string; contact_person: string; status: string };
  if (co.status !== "approved") return { ok: false, message: "Approve the company first, so they can log in and pay." };
  await db.from("invoices").update({ status: "open", sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", id);
  const payUrl = `${SITE()}/portal/billing/${id}`;
  await Promise.allSettled([
    sendEmail({ to: co.email, ...invoiceReady({ name: co.contact_person, number: inv.number, amountCents: inv.amount_cents, currency: inv.currency, description: inv.description, due: inv.due_date ?? undefined, payUrl }) }),
    db.from("notifications").insert({ user_id: co.owner_id, title: `New invoice ${inv.number}`, body: inv.description, link: `/portal/billing/${id}` }),
  ]);
  await log(a.me.id, "invoice_sent", id, { number: inv.number });
  refresh();
  return { ok: true, id };
}

export async function voidInvoice(id: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const db = supabaseAdmin();
  const { data: inv } = await db.from("invoices").select("status, number").eq("id", id).maybeSingle();
  if (!inv || !["draft", "open"].includes(inv.status)) return { ok: false, message: "Only an unpaid invoice can be cancelled. Use a refund for a paid one." };
  await db.from("invoices").update({ status: "void", updated_at: new Date().toISOString() }).eq("id", id);
  await log(a.me.id, "invoice_void", id, { number: inv.number });
  refresh();
  return { ok: true };
}

export async function refund(id: string, cents: number): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Unknown invoice." };
  try {
    const r = await stripeRefund(id, Math.round(cents), a.me.id);
    if (!r.ok) return r;
  } catch (e) {
    return { ok: false, message: `Stripe did not accept the refund: ${(e as Error).message.slice(0, 120)}` };
  }
  await log(a.me.id, "invoice_refund", id, { cents });
  refresh();
  return { ok: true };
}

const feeSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(2, "Name the fee.").max(80),
  kind: z.enum(["fixed", "percent"]),
  defaultCents: z.number().int().min(0).max(100_000_000).nullable(),
  defaultPercent: z.number().min(0).max(100).nullable(),
  description: z.string().trim().max(300),
  active: z.boolean(),
});
export async function saveFeeType(input: z.input<typeof feeSchema>): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const p = feeSchema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Please check the fee." };
  const row = { name: p.data.name, kind: p.data.kind, default_cents: p.data.kind === "fixed" ? p.data.defaultCents : null, default_percent: p.data.kind === "percent" ? p.data.defaultPercent : null, description: p.data.description || null, active: p.data.active };
  const db = supabaseAdmin();
  const { error } = p.data.id ? await db.from("fee_types").update(row).eq("id", p.data.id) : await db.from("fee_types").insert({ ...row, sort: 50 });
  if (error) return { ok: false, message: error.code === "23505" ? "A fee with this name already exists." : "We could not save the fee." };
  await log(a.me.id, "fee_type_saved", p.data.name, row);
  refresh();
  return { ok: true };
}
