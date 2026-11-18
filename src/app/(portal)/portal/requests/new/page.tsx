import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { StaffingRequestForm } from "@/components/portal/EmployerClient";

export const metadata: Metadata = { title: "New staffing request", robots: { index: false } };

export default async function NewRequest() {
  const { user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  return (
    <div className="pwrap pwrap--narrow">
      <p className="back"><a href="/portal/requests">All requests</a></p>
      <PageHead title="New staffing request" sub="Not every role needs a public job post. Tell us who you need and our recruiters do the search." />
      <StaffingRequestForm company={{ name: company.name, contact: company.contact_person, email: company.email, phone: company.phone ?? "" }} />
    </div>
  );
}
