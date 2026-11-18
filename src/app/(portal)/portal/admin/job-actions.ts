"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { jobSchema, issues, jobRow, type JobInput } from "@/lib/jobs/schema";
import { notifyJobReviewed, notifyStatusChange } from "@/lib/email/notify";
import { APP_STATUS } from "@/lib/portal/seeker";

type Result = { ok: boolean; message?: string; errors?: Record<string, string>; id?: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: me } = await sb.from("profiles").select("id, role, status").eq("id", user.id).single();
  if (!me || me.role !== "admin" || me.status !== "active") return null;
  return { sb, me };
}
const log = (actorId: string, action: string, target: string, details: Record<string, unknown>) =>
  supabaseAdmin().from("admin_log").insert({ actor_id: actorId, action, target, details });
const refresh = () => { revalidatePath("/portal", "layout"); revalidatePath("/find-opportunities"); };

// Create or edit any job. "publish" puts it live straight away (the team needs no review); "draft" keeps it hidden.
// companyId: the employer the job is for, or empty for a RemoteCore job.
export async function adminSaveJob(input: JobInput, opts: { id?: string; mode: "draft" | "publish"; companyId?: string }): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const parsed = jobSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: issues(parsed.error), message: "Please check the fields marked in red." };
  const row = { ...jobRow(parsed.data), review_note: null };
  const status = opts.mode === "publish" ? "published" : "draft";
  if (opts.id) {
    if (!UUID.test(opts.id)) return { ok: false, message: "Unknown job." };
    const { data: before } = await a.sb.from("jobs").select("status, title").eq("id", opts.id).maybeSingle();
    if (!before) return { ok: false, message: "Unknown job." };
    const next = opts.mode === "publish" ? "published" : before.status === "published" ? "published" : before.status;
    const { error } = await a.sb.from("jobs").update({ ...row, status: next }).eq("id", opts.id);
    if (error) return { ok: false, message: "We could not save this job. Please try again." };
    await log(a.me.id, "job_saved", opts.id, { title: row.title, from: before.status, to: next });
    if (before.status === "pending" && next === "published") await notifyJobReviewed(opts.id, true);
    refresh();
    return { ok: true, id: opts.id };
  }
  let companyId: string | null = null;
  if (opts.companyId) {
    if (!UUID.test(opts.companyId)) return { ok: false, message: "Unknown company." };
    const { data: c } = await a.sb.from("companies").select("id, status").eq("id", opts.companyId).maybeSingle();
    if (c?.status !== "approved") return { ok: false, message: "Choose an approved company, or post it as RemoteCore." };
    companyId = c.id;
  }
  const { data, error } = await a.sb.from("jobs").insert({ ...row, status, company_id: companyId, created_by: a.me.id }).select("id").single();
  if (error || !data) return { ok: false, message: "We could not save this job. Please try again." };
  await log(a.me.id, "job_saved", data.id, { title: row.title, to: status, company: companyId });
  refresh();
  return { ok: true, id: data.id };
}

// Approve an employer's job, or send it back with what to change. The employer gets an email either way.
export async function reviewJob(id: string, approve: boolean, reason = ""): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Unknown job." };
  const note = String(reason).trim().slice(0, 1000);
  if (!approve && note.length < 5) return { ok: false, message: "Tell the employer what to change." };
  const { data: j } = await a.sb.from("jobs").select("status, title").eq("id", id).maybeSingle();
  if (!j) return { ok: false, message: "Unknown job." };
  if (j.status !== "pending") return { ok: false, message: "This job is not waiting for review any more." };
  const { error } = await a.sb.from("jobs").update(approve ? { status: "published", review_note: null } : { status: "draft", review_note: note }).eq("id", id);
  if (error) return { ok: false, message: "We could not save the review. Please try again." };
  await notifyJobReviewed(id, approve, note);
  await log(a.me.id, approve ? "job_approved" : "job_changes", id, { title: j.title, ...(approve ? {} : { reason: note }) });
  refresh();
  return { ok: true };
}

// Publish, pause or close any job.
export async function adminSetJobStatus(id: string, status: "published" | "paused" | "closed"): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id) || !["published", "paused", "closed"].includes(status)) return { ok: false, message: "Unknown job." };
  const { data: j } = await a.sb.from("jobs").select("status, title").eq("id", id).maybeSingle();
  if (!j) return { ok: false, message: "Unknown job." };
  const { error } = await a.sb.from("jobs").update({ status, ...(status === "published" ? { review_note: null } : {}) }).eq("id", id);
  if (error) return { ok: false, message: "That did not work. Please try again." };
  await log(a.me.id, "job_status", id, { title: j.title, from: j.status, to: status });
  if (j.status === "pending" && status === "published") await notifyJobReviewed(id, true);
  refresh();
  return { ok: true };
}

// Remove a job for good. Only when nobody applied, so no application history is lost. Otherwise close it.
export async function removeJob(id: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id)) return { ok: false, message: "Unknown job." };
  const { count } = await a.sb.from("applications").select("id", { count: "exact", head: true }).eq("job_id", id);
  if ((count ?? 0) > 0) return { ok: false, message: "People applied to this job, so it cannot be removed. Close it instead to keep their history." };
  const { data: j } = await a.sb.from("jobs").select("title").eq("id", id).maybeSingle();
  const { error } = await a.sb.from("jobs").delete().eq("id", id);
  if (error) return { ok: false, message: "We could not remove the job. Please try again." };
  await log(a.me.id, "job_removed", id, { title: j?.title });
  refresh();
  return { ok: true };
}

// Change any application's status. The candidate gets an email and an in app notice.
export async function adminSetApplicationStatus(appId: string, status: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(appId) || !(status in APP_STATUS)) return { ok: false, message: "Something is wrong with this request." };
  const { data: app } = await a.sb.from("applications").select("status").eq("id", appId).maybeSingle();
  if (!app) return { ok: false, message: "We could not find this application." };
  if (app.status === status) return { ok: true };
  const { error } = await a.sb.from("applications").update({ status }).eq("id", appId);
  if (error) return { ok: false, message: "We could not change the status. Please try again." };
  await notifyStatusChange(appId);
  await log(a.me.id, "application_status", appId, { from: app.status, to: status });
  revalidatePath("/portal", "layout");
  return { ok: true };
}

const cleanName = (n: string) => String(n ?? "").trim().replace(/\s+/g, " ").slice(0, 80);

export async function addCategory(name: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const n = cleanName(name);
  if (n.length < 2) return { ok: false, message: "Enter the category name." };
  const { data: last } = await a.sb.from("job_categories").select("sort").lt("sort", 99).order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await a.sb.from("job_categories").insert({ name: n, sort: (last?.sort ?? 0) + 1 });
  if (error) return { ok: false, message: error.code === "23505" ? "This category already exists." : "We could not add it. Please try again." };
  await log(a.me.id, "category_added", n, { name: n });
  refresh();
  return { ok: true };
}

export async function renameCategory(id: number, name: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const n = cleanName(name);
  if (!Number.isInteger(id) || n.length < 2) return { ok: false, message: "Enter the category name." };
  const { error } = await a.sb.rpc("rename_category", { cat_id: id, new_name: n });
  if (error) return { ok: false, message: error.code === "23505" ? "Another category already has this name." : "We could not rename it. Please try again." };
  await log(a.me.id, "category_renamed", String(id), { to: n });
  refresh();
  return { ok: true };
}

// Move a category one place up or down in every list on the site.
export async function moveCategory(id: number, dir: -1 | 1): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const { data: list } = await a.sb.from("job_categories").select("id, sort").order("sort").order("id");
  const cats = list ?? [];
  const i = cats.findIndex((c) => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= cats.length) return { ok: true };
  const order = cats.map((c) => c.id);
  [order[i], order[j]] = [order[j], order[i]];
  // "Other" stays last.
  const updates = order.map((cid, k) => ({ id: cid, sort: cats.find((c) => c.id === cid)!.sort === 99 ? 99 : k + 1 }));
  for (const u of updates) await a.sb.from("job_categories").update({ sort: u.sort }).eq("id", u.id);
  refresh();
  return { ok: true };
}

export async function deleteCategory(id: number): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const { count } = await a.sb.from("jobs").select("id", { count: "exact", head: true }).eq("category_id", id);
  if ((count ?? 0) > 0) return { ok: false, message: `${count} ${count === 1 ? "job uses" : "jobs use"} this category. Move them to another category first.` };
  const { data: c } = await a.sb.from("job_categories").select("name").eq("id", id).maybeSingle();
  const { error } = await a.sb.from("job_categories").delete().eq("id", id);
  if (error) return { ok: false, message: "We could not delete it. Please try again." };
  await log(a.me.id, "category_deleted", String(id), { name: c?.name });
  refresh();
  return { ok: true };
}
