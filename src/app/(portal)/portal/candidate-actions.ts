"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyStatusChange, notifyEmployerMessage } from "@/lib/email/notify";
import { APP_STATUS } from "@/lib/portal/seeker";

type Result = { ok: boolean; message?: string; url?: string };
const UUID = /^[0-9a-f-]{36}$/i;
// Signed links to resumes, voice intros and documents last 5 minutes. A new one is made on every click.
const LINK_SECONDS = 300;

// The signed in employer's approved company, or null.
async function approvedEmployer() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { sb, company: null };
  const { data: company } = await sb.from("companies").select("id, status").eq("owner_id", user.id).maybeSingle();
  return { sb, company: company?.status === "approved" ? company : null };
}

// One application on one of this employer's jobs, read as the employer (row level security applies).
async function ownApplication(sb: Awaited<ReturnType<typeof supabaseServer>>, companyId: string, appId: string) {
  if (!UUID.test(appId)) return null;
  const { data } = await sb.from("applications")
    .select("id, status, seeker_id, resume_path, extra_documents, jobs!inner(company_id)")
    .eq("id", appId).eq("jobs.company_id", companyId).maybeSingle();
  return data;
}

// Move an application to a new status. The database logs it and adds the in-app notice; this sends the email.
export async function setApplicationStatus(appId: string, status: string): Promise<Result> {
  const { sb, company } = await approvedEmployer();
  if (!company) return { ok: false, message: "Please log in again." };
  if (!(status in APP_STATUS)) return { ok: false, message: "Unknown status." };
  const app = await ownApplication(sb, company.id, appId);
  if (!app) return { ok: false, message: "We could not find this application." };
  if (app.status === status) return { ok: true };
  const { data, error } = await sb.from("applications").update({ status }).eq("id", appId).select("id").maybeSingle();
  if (error || !data) return { ok: false, message: "We could not change the status. Please try again." };
  await notifyStatusChange(appId);
  revalidatePath("/portal", "layout");
  return { ok: true };
}

// A short lived link to the resume, voice intro or an extra document of a candidate who applied to this employer.
// Employers never read private storage directly: the check happens here, then the server signs one link.
export async function openCandidateFile(appId: string, kind: "resume" | "audio" | "document", index = 0): Promise<Result> {
  const { sb, company } = await approvedEmployer();
  if (!company) return { ok: false, message: "Please log in again." };
  const app = await ownApplication(sb, company.id, appId);
  if (!app) return { ok: false, message: "We could not find this application." };
  const { data: allowed } = await sb.rpc("employer_can_see", { seeker: app.seeker_id });
  if (allowed !== true) return { ok: false, message: "You do not have access to this file." };

  let bucket = "", path: string | null = null;
  if (kind === "document") {
    bucket = "documents";
    path = Number.isInteger(index) && index >= 0 ? app.extra_documents?.[index] ?? null : null;
  } else {
    const { data: sp } = await sb.from("seeker_profiles").select("resume_path, audio_path").eq("user_id", app.seeker_id).maybeSingle();
    if (kind === "resume") { bucket = "resumes"; path = app.resume_path ?? sp?.resume_path ?? null; }
    else if (kind === "audio") { bucket = "audio"; path = sp?.audio_path ?? null; }
  }
  if (!bucket || !path) return { ok: false, message: "This file is not there any more." };
  if (!path.startsWith(`${app.seeker_id}/`) || path.includes("..")) return { ok: false, message: "You do not have access to this file." };
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUrl(path, LINK_SECONDS);
  if (error || !data?.signedUrl) return { ok: false, message: "This file is not there any more." };
  return { ok: true, url: data.signedUrl };
}

// A message to the RemoteCore team. "about" links it to one of this employer's applicants.
export async function sendCompanyMessage(input: { body: string; about?: string }): Promise<Result> {
  const { sb, company } = await approvedEmployer();
  if (!company) return { ok: false, message: "Please log in again." };
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const text = String(input.body ?? "").trim();
  if (text.length < 2) return { ok: false, message: "Write your message first." };
  if (text.length > 4000) return { ok: false, message: "Please keep it under 4,000 characters." };
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await sb.from("messages").select("id", { count: "exact", head: true }).eq("sender_id", user.id).gte("created_at", hourAgo);
  if ((count ?? 0) >= 20) return { ok: false, message: "You sent a lot of messages in the last hour. Please wait a little." };

  let about = "";
  if (input.about && UUID.test(input.about)) {
    const { data: a } = await sb.from("applications")
      .select("id, jobs!inner(title, company_id), profiles!applications_seeker_id_fkey(full_name)")
      .eq("id", input.about).eq("jobs.company_id", company.id).maybeSingle();
    if (a) {
      const job = a.jobs as unknown as { title: string };
      const who = a.profiles as unknown as { full_name: string } | null;
      about = `${who?.full_name || "Candidate"}, ${job.title} (ref ${a.id.slice(0, 8).toUpperCase()})`;
    }
  }
  const body = about ? `About ${about}\n\n${text}` : text;
  const { data, error } = await sb.from("messages").insert({ company_id: company.id, sender_id: user.id, body }).select("id").single();
  if (error || !data) return { ok: false, message: "We could not send your message. Please try again." };
  await notifyEmployerMessage(data.id);
  revalidatePath("/portal/messages");
  return { ok: true };
}
