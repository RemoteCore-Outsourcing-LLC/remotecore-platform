import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead, Empty } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";

export const metadata: Metadata = { title: "Invoices and payments", robots: { index: false } };

// Invoices and payments arrive with the Stripe milestone. Until then the page says where they will show.
export default async function Billing() {
  const { user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Invoices and payments" sub="Your invoices from RemoteCore and the payments you made." />
      <section className="panel" aria-label="Invoices">
        <Empty title="No invoices yet" action={<a className="btn btn--ghost btn--sm" href="/portal/messages">Ask about fees</a>}>When RemoteCore sends you an invoice, it shows up here and in your email, and you can pay it by card.</Empty>
      </section>
    </div>
  );
}
