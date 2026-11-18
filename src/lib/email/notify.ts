import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "./send";
import { applicationReceived, newApplicationAdmin, newApplicationEmployer, statusChanged, welcomeSeeker, newSeekerAdmin, employerWelcome, newEmployerAdmin, employerApproved } from "./templates";

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

// The first time a new account confirms its email: welcome the person and tell the team.
// The welcomed_at stamp is set in the same step, so a second click on the link sends nothing.
export async function notifyNewAccount(userId: string) {
  const { data: p } = await supabaseAdmin().from("profiles")
    .update({ welcomed_at: new Date().toISOString() }).eq("id", userId).is("welcomed_at", null)
    .select("role, full_name, email, country").maybeSingle();
  if (!p) return;
  const team = adminEmails();
  if (p.role === "employer") {
    const { data: c } = await supabaseAdmin().from("companies").select("name, contact_person, email, country, industry").eq("owner_id", userId).maybeSingle();
    if (!c) return;
    await Promise.allSettled([
      sendEmail({ to: p.email, ...employerWelcome({ name: c.contact_person, company: c.name }) }),
      team.length ? sendEmail({ to: team, ...newEmployerAdmin({ company: c.name, contact: c.contact_person, email: c.email, country: c.country ?? "", industry: c.industry ?? "" }) }) : null,
    ]);
    return;
  }
  if (p.role !== "job_seeker") return;
  await Promise.allSettled([
    sendEmail({ to: p.email, ...welcomeSeeker({ name: p.full_name }) }),
    team.length ? sendEmail({ to: team, ...newSeekerAdmin({ name: p.full_name, email: p.email, country: p.country ?? "" }) }) : null,
  ]);
}

// Call this from the admin screen right after a company is approved.
export async function notifyCompanyApproved(companyId: string) {
  const db = supabaseAdmin();
  const { data: c } = await db.from("companies").select("owner_id, name, contact_person, email, status").eq("id", companyId).maybeSingle();
  if (!c || c.status !== "approved") return;
  await db.from("notifications").insert({ user_id: c.owner_id, title: "Your company account is approved", body: "You can now post jobs and send staffing requests.", link: "/portal" });
  await sendEmail({ to: c.email, ...employerApproved({ name: c.contact_person, company: c.name }) });
}
