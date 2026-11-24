"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getEmployer } from "@/lib/portal/employer";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { activeContract, fillContract, today } from "@/lib/contracts";
import { sendEmail, adminEmails } from "@/lib/email/send";
import { contractCopy } from "@/lib/email/templates";

// The employer signs the current agreement by typing their full name and ticking the box.
export async function signContract(templateId: string, name: string, agree: boolean): Promise<{ ok: boolean; message?: string; id?: string }> {
  const { user, company } = await getEmployer();
  if (!user || !company) return { ok: false, message: "Please log in again." };
  if (company.status !== "approved") return { ok: false, message: "Your company account is not approved yet." };
  const signer = name.trim().replace(/\s+/g, " ");
  if (signer.length < 3 || signer.length > 120 || !signer.includes(" ")) return { ok: false, message: "Type your full name, first and last." };
  if (!agree) return { ok: false, message: "Tick the box to agree." };
  const t = await activeContract();
  if (!t || t.id !== templateId) return { ok: false, message: "This agreement changed. Please read the new version." };
  const db = supabaseAdmin();
  const { data: done } = await db.from("contract_signatures").select("id").eq("company_id", company.id).eq("template_id", t.id).maybeSingle();
  if (done) return { ok: true, id: done.id };
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0].trim() || h.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${process.env.EMAIL_LINK_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
  const body = fillContract(t.body, { client_name: signer, client_email: company.email, company_name: company.name, company_country: company.country ?? "", date: today() });
  const { data: row, error } = await db.from("contract_signatures").insert({
    template_id: t.id, company_id: company.id, signer_id: user.id, title: t.title, body, signer_name: signer,
    signer_email: company.email, company_name: company.name, ip_hash: ipHash,
  }).select("id, signed_at").single();
  if (error || !row) return { ok: false, message: "We could not save your signature. Please try again." };
  const team = adminEmails();
  await Promise.allSettled([
    sendEmail({ to: company.email, ...contractCopy({ name: signer, title: t.title, body, signedAt: row.signed_at, signer, company: company.name }) }),
    team.length ? sendEmail({ to: team, ...contractCopy({ name: signer, title: t.title, body, signedAt: row.signed_at, signer, company: company.name, team: true }) }) : null,
  ]);
  revalidatePath("/portal", "layout");
  return { ok: true, id: row.id };
}
