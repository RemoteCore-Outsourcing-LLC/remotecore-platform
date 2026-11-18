import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { JobForm, EMPTY_JOB } from "@/components/portal/JobForm";

export const metadata: Metadata = { title: "Post a job", robots: { index: false } };

export default async function NewJob() {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const { data: cats } = await sb.from("job_categories").select("id, name").order("sort");
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Post a job" sub="RemoteCore reviews every job before job seekers can see it." />
      <JobForm initial={EMPTY_JOB} categories={cats ?? []} />
    </div>
  );
}
