import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ContractDoc } from "@/components/portal/ContractClient";

export const metadata: Metadata = { title: "Signed agreement", robots: { index: false } };

// A signed copy. Row level security shows it only to the company that signed and to the team.
export default async function SignedContract({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, profile } = await getSession();
  if (!user || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = profile?.role === "admin" && profile.status === "active" ? supabaseAdmin() : sb;
  const { data: c } = await db.from("contract_signatures").select("id, title, body, signer_name, signer_email, company_name, signed_at").eq("id", id).maybeSingle();
  if (!c) notFound();
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href={profile?.role === "admin" ? "/portal/admin/contracts" : "/portal/contract"}>All agreements</a></p>
      <ContractDoc c={c} />
    </div>
  );
}
