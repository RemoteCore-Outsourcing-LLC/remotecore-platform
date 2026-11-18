import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { PageHead } from "@/components/portal/Dash";
import { CompanyPill, type Company } from "@/components/portal/Employer";
import { CompanyForm } from "@/components/portal/CompanyForm";

export const metadata: Metadata = { title: "Company profile", robots: { index: false } };

export default async function CompanyPage() {
  const { sb, user, profile } = await getSession();
  if (!user || !profile) return null;
  if (profile.role !== "employer") redirect("/portal");
  const { data } = await sb.from("companies").select("*").eq("owner_id", user.id).maybeSingle();
  const c = data as Company | null;
  if (!c) redirect("/portal");
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Company profile" sub="The RemoteCore team uses these details when we find candidates for you." aside={<CompanyPill status={c.status} />} />
      <section className="psec" aria-labelledby="co-h">
        <header className="psec__head"><h2 id="co-h">Company details</h2></header>
        <CompanyForm c={c} />
      </section>
    </div>
  );
}
