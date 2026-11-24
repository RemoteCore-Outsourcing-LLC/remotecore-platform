"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PLACEHOLDERS } from "@/lib/contracts";

type Result = { ok: boolean; message?: string; id?: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function admin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: me } = await sb.from("profiles").select("id, role, status").eq("id", user.id).single();
  return me?.role === "admin" && me.status === "active" ? me : null;
}
const done = () => { revalidatePath("/portal/admin/contracts"); revalidatePath("/portal/contract"); };

// Save a template. A template someone already signed is never changed: saving makes a new version.
export async function saveContract(input: { id?: string | null; title: string; body: string }): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, message: "Please log in again." };
  const title = input.title.trim(), body = input.body.replace(/\r\n/g, "\n").trim();
  if (title.length < 3 || title.length > 150) return { ok: false, message: "Give the agreement a name." };
  if (body.length < 50 || body.length > 100_000) return { ok: false, message: "Paste the full agreement text." };
  const known = new Set(PLACEHOLDERS.map(([k]) => k));
  const wrong = Array.from(new Set(body.match(/\{\{[^{}]*\}\}/g) ?? [])).filter((t) => !known.has(t));
  if (wrong.length) return { ok: false, message: `These blanks are not known: ${wrong.join(", ")}. Use the blank buttons instead.` };
  const db = supabaseAdmin();
  if (input.id && UUID.test(input.id)) {
    const { data: used } = await db.from("contract_signatures").select("id").eq("template_id", input.id).limit(1).maybeSingle();
    if (!used) {
      const { error } = await db.from("contract_templates").update({ title, body }).eq("id", input.id);
      if (error) return { ok: false, message: "We could not save. Please try again." };
      done(); return { ok: true, id: input.id };
    }
    // Already signed by someone: keep that version as it is and make a new one.
    const { data: old } = await db.from("contract_templates").select("active").eq("id", input.id).maybeSingle();
    const { data: row, error } = await db.from("contract_templates").insert({ title, body, created_by: me.id }).select("id").single();
    if (error || !row) return { ok: false, message: "We could not save. Please try again." };
    if (old?.active) await activate(row.id, me.id);
    done(); return { ok: true, id: row.id, message: "Saved as a new version. Companies sign the new version before their next payment." };
  }
  const { data: row, error } = await db.from("contract_templates").insert({ title, body, created_by: me.id }).select("id").single();
  if (error || !row) return { ok: false, message: "We could not save. Please try again." };
  done(); return { ok: true, id: row.id };
}

async function activate(id: string, actor: string) {
  const db = supabaseAdmin();
  await db.from("contract_templates").update({ active: false }).eq("active", true);
  await db.from("contract_templates").update({ active: true }).eq("id", id);
  await db.from("admin_log").insert({ actor_id: actor, action: "contract_active", target: id, details: {} });
}

// Only one agreement is in use at a time. Turning it off means nobody has to sign before paying.
export async function setContractActive(id: string, on: boolean): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Something is wrong with this request." };
  if (on) await activate(id, me.id);
  else await supabaseAdmin().from("contract_templates").update({ active: false }).eq("id", id);
  done(); return { ok: true };
}

export async function deleteContract(id: string): Promise<Result> {
  const me = await admin();
  if (!me) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Something is wrong with this request." };
  const db = supabaseAdmin();
  const { data: used } = await db.from("contract_signatures").select("id").eq("template_id", id).limit(1).maybeSingle();
  if (used) return { ok: false, message: "Someone signed this agreement, so it stays on record." };
  await db.from("contract_templates").delete().eq("id", id);
  done(); return { ok: true };
}
