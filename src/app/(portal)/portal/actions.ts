"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
  await Promise.all(["resumes", "audio", "documents"].map((b) => removeFolder(admin, b, user.id)));
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, message: "We could not delete your account. Please contact us and we will do it for you." };
  await sb.auth.signOut();
  return { ok: true };
}
