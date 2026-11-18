import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "./send";
import { applicationReceived, newApplicationAdmin, newApplicationEmployer, statusChanged, welcomeSeeker, newSeekerAdmin, employerWelcome, newEmployerAdmin, employerApproved, newJobPostAdmin, staffingRequestReceived, newStaffingRequestAdmin, newEmployerMessageAdmin } from "./templates";

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

// A job was sent for review (new, or changed after it was approved). Tells the team.
export async function notifyJobSubmitted(jobId: string, edited: boolean) {
  const team = adminEmails();
  if (!team.length) return;
  const { data: j } = await supabaseAdmin().from("jobs").select("title, companies(name)").eq("id", jobId).maybeSingle();
  if (!j) return;
  const company = (j.companies as unknown as { name: string } | null)?.name ?? "RemoteCore";
  await sendEmail({ to: team, ...newJobPostAdmin({ title: j.title, company, status: edited ? "Edited, waiting for a new review" : "New, waiting for review" }) });
}

// A staffing request from the employer dashboard: receipt to the employer, alert to the team, note in the bell.
export async function notifyStaffingRequest(requestId: string) {
  const db = supabaseAdmin();
  const { data: r } = await db.from("staffing_requests").select("id, created_by, company_name, contact_name, email, position, number_needed").eq("id", requestId).maybeSingle();
  if (!r) return;
  const ref = r.id.slice(0, 8).toUpperCase();
  const team = adminEmails();
  await Promise.allSettled([
    r.created_by ? db.from("notifications").insert({ user_id: r.created_by, title: "Staffing request received", body: `We received your request for ${r.position}. Reference ${ref}.`, link: "/portal/requests" }) : null,
    sendEmail({ to: r.email, ...staffingRequestReceived({ name: r.contact_name ?? "", position: r.position, ref, account: true }) }),
    team.length ? sendEmail({ to: team, ...newStaffingRequestAdmin({ company: r.company_name ?? "", contact: r.contact_name ?? "", email: r.email ?? "", position: r.position, hires: String(r.number_needed ?? ""), ref }) }) : null,
  ]);
}

// An employer wrote to RemoteCore from the Messages page. Tells the team; the reply comes from the admin dashboard.
export async function notifyEmployerMessage(messageId: string, about?: string) {
  const team = adminEmails();
  if (!team.length) return;
  const { data: m } = await supabaseAdmin().from("messages").select("body, companies(name, contact_person, email)").eq("id", messageId).maybeSingle();
  if (!m) return;
  const c = m.companies as unknown as { name: string; contact_person: string; email: string } | null;
  await sendEmail({ to: team, replyTo: c?.email, ...newEmployerMessageAdmin({ company: c?.name ?? "An employer", contact: c?.contact_person ?? "", body: m.body, about }) });
}
