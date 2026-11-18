import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { PageHead } from "@/components/portal/Dash";
import { JobForm, EMPTY_JOB } from "@/components/portal/JobForm";

export const metadata: Metadata = { title: "Post a job", robots: { index: false } };


export default async function AdminNewJob() {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const [{ data: cats }, { data: cos }] = await Promise.all([
    sb.from("job_categories").select("id, name").order("sort"),
    sb.from("companies").select("id, name").eq("status", "approved").order("name"),
  ]);
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/admin/jobs">All jobs</a></p>
      <PageHead title="Post a job" sub="Jobs from the RemoteCore team go live as soon as you publish them." />
      <JobForm initial={EMPTY_JOB} categories={cats ?? []} admin={{ companies: cos ?? [] }} />
    </div>
  );
}
