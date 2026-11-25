"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyNewApplication } from "@/lib/email/notify";
import { z } from "zod";
import { cleanWebsite } from "@/lib/employer";

type Result = { ok: boolean; message?: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function me() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return { sb, user };
}

// Save a job for later, or remove it from the saved list.
export async function toggleSave(jobId: string, save: boolean): Promise<Result> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  if (!UUID.test(jobId)) return { ok: false, message: "Unknown job." };
  const { error } = save
    ? await sb.from("saved_jobs").upsert({ user_id: user.id, job_id: jobId }, { onConflict: "user_id,job_id", ignoreDuplicates: true })
    : await sb.from("saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
  if (error) return { ok: false, message: "That did not work. Please try again." };
  revalidatePath("/portal", "layout");
  return { ok: true };
}

export async function markAllRead(): Promise<Result> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/portal", "layout");
  return { ok: true };
}

// Talent Marketplace consent. Turning it on asks RemoteCore to review the listing; an admin publishes it.
export async function setMarketplace(consent: boolean): Promise<Result> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  const { error } = await sb.from("seeker_profiles")
    .update({ marketplace_consent: consent, marketplace_status: consent ? "pending" : "hidden", updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  revalidatePath("/portal/settings");
  return { ok: true };
}

async function removeFolder(admin: ReturnType<typeof supabaseAdmin>, bucket: string, uid: string) {
  const { data } = await admin.storage.from(bucket).list(uid, { limit: 1000 });
  if (data?.length) await admin.storage.from(bucket).remove(data.map((f) => `${uid}/${f.name}`));
}

// Delete the account, every profile row (they cascade) and every private file.
export async function deleteAccount(confirm: string): Promise<Result> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  if (confirm.trim().toUpperCase() !== "DELETE") return { ok: false, message: "Type DELETE to confirm." };
  const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "job_seeker") return { ok: false, message: "Employer and admin accounts are closed by RemoteCore. Please contact us." };

  const admin = supabaseAdmin();
  await Promise.all(["resumes", "audio", "documents", "photos"].map((b) => removeFolder(admin, b, user.id)));
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, message: "We could not delete your account. Please contact us and we will do it for you." };
  await sb.auth.signOut();
  return { ok: true };
}

// Apply for a job with the saved profile and resume. Extra documents are already uploaded by the browser
// into the applicant's own private folder; only their paths come in here.
export async function applyToJob(input: { jobId: string; note: string; documents: string[]; confirm: boolean }): Promise<Result & { appliedAt?: string; ref?: string }> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Your session ended. Please log in again." };
  const { jobId, confirm } = input;
  const note = String(input.note ?? "").trim().slice(0, 1500);
  const documents = Array.isArray(input.documents) ? input.documents.slice(0, 3) : [];
  if (!UUID.test(jobId)) return { ok: false, message: "Unknown job." };
  if (!confirm) return { ok: false, message: "Please tick the box to confirm." };
  if (documents.some((d) => typeof d !== "string" || !d.startsWith(`${user.id}/`) || d.includes(".."))) return { ok: false, message: "One of the files is not yours." };

  const [{ data: job }, { data: sp }, { data: existing }] = await Promise.all([
    sb.from("jobs").select("id, title, status, deadline, documents_required").eq("id", jobId).maybeSingle(),
    sb.from("seeker_profiles").select("resume_path").eq("user_id", user.id).maybeSingle(),
    sb.from("applications").select("id").eq("job_id", jobId).eq("seeker_id", user.id).maybeSingle(),
  ]);
  if (existing) return { ok: false, message: "You already applied for this job." };
  if (!job || job.status !== "published" || (job.deadline && job.deadline < new Date().toISOString().slice(0, 10))) return { ok: false, message: "This job is no longer open." };
  if (!sp?.resume_path) return { ok: false, message: "Add your resume to your profile first." };
  if (job.documents_required && documents.length === 0) return { ok: false, message: "This job asks for an extra document. Please add it." };

  // Keep a copy of the resume as it is today, so replacing it later does not change what this employer received.
  if (!sp.resume_path.startsWith(`${user.id}/`) || sp.resume_path.includes("..")) return { ok: false, message: "Please upload your resume again on your profile." };
  const ext = sp.resume_path.split(".").pop();
  const snapshot = `${user.id}/applied-${jobId.slice(0, 8)}-${Date.now()}.${ext}`;
  const admin = supabaseAdmin();
  const copied = await admin.storage.from("resumes").copy(sp.resume_path, snapshot);
  const resumePath = copied.error ? sp.resume_path : snapshot;

  const { data: app, error } = await sb.from("applications")
    .insert({ job_id: jobId, seeker_id: user.id, note: note || null, resume_path: resumePath, extra_documents: documents })
    .select("id, created_at").single();
  if (error || !app) {
    if (!copied.error) await admin.storage.from("resumes").remove([snapshot]);
    return { ok: false, message: error?.code === "23505" ? "You already applied for this job." : "We could not send your application. Please try again." };
  }
  await admin.from("notifications").insert({
    user_id: user.id, title: "Application received", link: "/portal/applications",
    body: `We received your application for ${job.title}. You can follow its status in My applications.`,
  });
  await notifyNewApplication(app.id);
  revalidatePath("/portal", "layout");
  return { ok: true, appliedAt: app.created_at, ref: app.id.slice(0, 8).toUpperCase() };
}

// Weekly job alert emails, on or off.
export async function setJobAlerts(on: boolean): Promise<Result> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  const { error } = await sb.from("seeker_profiles").update({ job_alerts: on }).eq("user_id", user.id);
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  revalidatePath("/portal/settings");
  return { ok: true };
}

// Employer: edit the company profile. Status, owner and email stay as they are (the database guards them too).
const companySchema = z.object({
  name: z.string().trim().min(2, "Enter your company name.").max(200),
  contact_person: z.string().trim().min(2, "Enter the contact person.").max(200),
  phone: z.string().trim().max(40),
  country: z.string().trim().max(100),
  website: z.string().trim().max(300),
  industry: z.string().trim().max(120),
  description: z.string().trim().min(20, "Tell us a little about your company (at least 20 characters).").max(2000),
});
export async function updateCompany(input: z.input<typeof companySchema>): Promise<Result & { errors?: Record<string, string> }> {
  const { sb, user } = await me();
  if (!user) return { ok: false, message: "Please log in again." };
  const parsed = companySchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) };
  const site = cleanWebsite(parsed.data.website);
  if (site === null) return { ok: false, errors: { website: "Check the website address, for example yourcompany.com." } };
  const { error } = await sb.from("companies").update({ ...parsed.data, website: site || null }).eq("owner_id", user.id);
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  revalidatePath("/portal", "layout");
  return { ok: true };
}
