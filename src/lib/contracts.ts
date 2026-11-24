import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Contracts (call 2026-11-23): the team writes the agreement once, with blanks like {{client_name}}.
// An employer reads it with their details filled in, types their name to sign, and both sides get a copy.
// No AI is needed: the blanks are filled from the company profile, so it costs nothing to run.

export const PLACEHOLDERS: [string, string][] = [
  ["{{client_name}}", "Name of the person signing"],
  ["{{client_email}}", "Their business email"],
  ["{{company_name}}", "Their company name"],
  ["{{company_country}}", "Their company country"],
  ["{{date}}", "The date they sign"],
];

export type ContractVars = { client_name: string; client_email: string; company_name: string; company_country: string; date: string };

export const fillContract = (body: string, v: ContractVars) =>
  body.replace(/\{\{\s*(client_name|client_email|company_name|company_country|date)\s*\}\}/g, (_, k: keyof ContractVars) => v[k] || "________");

export const today = () => new Date().toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/Chicago" });

export async function activeContract() {
  const { data } = await supabaseAdmin().from("contract_templates").select("id, title, body").eq("active", true).maybeSingle();
  return data as { id: string; title: string; body: string } | null;
}

// True when the company must sign the current agreement before it can pay.
export async function needsSignature(companyId: string) {
  const t = await activeContract();
  if (!t) return null;
  const { data } = await supabaseAdmin().from("contract_signatures").select("id").eq("company_id", companyId).eq("template_id", t.id).limit(1).maybeSingle();
  return data ? null : t;
}
