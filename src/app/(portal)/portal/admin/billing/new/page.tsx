import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { PageHead } from "@/components/portal/Dash";
import { InvoiceForm } from "@/components/portal/BillingClient";

export const metadata: Metadata = { title: "Make an invoice", robots: { index: false } };

export default async function NewInvoice({ searchParams }: { searchParams: Promise<{ company?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const { company } = await searchParams;
  const [{ data: cos }, { data: fees }] = await Promise.all([
    sb.from("companies").select("id, name").eq("status", "approved").order("name"),
    sb.from("fee_types").select("id, name, kind, default_cents, default_percent").eq("active", true).order("sort").order("id"),
  ]);
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/admin/billing">Billing</a></p>
      <PageHead title="Make an invoice" sub="Send it now and the employer gets an email with a link to pay by card, or save it as a draft." />
      <InvoiceForm companies={cos ?? []} fees={(fees ?? []).map((f) => ({ ...f, default_percent: f.default_percent != null ? Number(f.default_percent) : null }))} presetCompany={company} />
    </div>
  );
}
