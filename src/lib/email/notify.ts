import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "./send";
import { applicationReceived, newApplicationAdmin, newApplicationEmployer, statusChanged } from "./templates";

const ref = (id: string) => id.slice(0, 8).toUpperCase();

async function loadApp(appId: string) {
  const { data } = await supabaseAdmin().from("applications")
    .select("id, status, created_at, seeker_id, jobs(title, company_id, companies(email)), profiles!applications_seeker_id_fkey(full_name, email, country)")
    .eq("id", appId).single();
  if (!data) return null;
  const job = data.jobs as unknown as { title: string; company_id: string | null; companies: { email: string } | null } | null;
  const who = data.profiles as unknown as { full_name: string; email: string; country: string | null } | null;
  return { ...data, job, who };
}

// After someone applies: confirmation to them, alert to RemoteCore, and to the employer if it is their job.
export async function notifyNewApplication(appId: string) {
  const a = await loadApp(appId);
  if (!a?.job || !a.who) return;
  const jobs: Promise<unknown>[] = [
    sendEmail({ to: a.who.email, ...applicationReceived({ name: a.who.full_name, job: a.job.title, at: a.created_at, ref: ref(a.id) }) }),
  ];
  const team = adminEmails();
  if (team.length) jobs.push(sendEmail({ to: team, ...newApplicationAdmin({ name: a.who.full_name || a.who.email, country: a.who.country ?? "", job: a.job.title, ref: ref(a.id) }) }));
  if (a.job.companies?.email) jobs.push(sendEmail({ to: a.job.companies.email, ...newApplicationEmployer({ job: a.job.title }) }));
  await Promise.allSettled(jobs);
}

// Call this from every place that changes an application's status (employer and admin screens).
// The in-app notification is added by the database itself; this sends the email.
export async function notifyStatusChange(appId: string) {
  const a = await loadApp(appId);
  if (!a?.job || !a.who) return;
  const mail = statusChanged({ name: a.who.full_name, job: a.job.title, status: a.status });
  if (mail) await sendEmail({ to: a.who.email, ...mail });
}
