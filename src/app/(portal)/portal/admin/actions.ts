"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyCompanyApproved } from "@/lib/email/notify";
import { sendEmail } from "@/lib/email/send";
import { teamInvite } from "@/lib/email/templates";

type Result = { ok: boolean; message?: string; id?: string };
const UUID = /^[0-9a-f-]{36}$/i;
const STATUSES = ["active", "suspended", "deactivated"] as const;
// A banned login cannot get a new session, so a suspended account is locked out of the API too, not only the screens.
const BAN_FOREVER = "876000h";

// The signed in admin. Every update below runs as this admin, so row level security and the database guards still apply.
async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: me } = await supabaseAdmin().from("profiles").select("id, full_name, email, role, status, admin_level").eq("id", user.id).single();
  if (!me || me.role !== "admin" || me.status !== "active") return null;
  return { sb, me, owner: me.admin_level === "owner" };
}

async function log(actorId: string, action: string, target: string, details: Record<string, unknown>) {
  await supabaseAdmin().from("admin_log").insert({ actor_id: actorId, action, target, details });
}

const done = (id?: string) => {
  revalidatePath("/portal/admin", "layout");
  revalidatePath("/portal");
  return { ok: true, id } as Result;
};

// Active, suspended or deactivated. Staff can change job seekers and employers; only an owner changes team accounts.
export async function setAccountStatus(userId: string, status: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(userId) || !STATUSES.includes(status as (typeof STATUSES)[number])) return { ok: false, message: "Something is wrong with this request." };
  if (userId === a.me.id) return { ok: false, message: "You cannot change your own account. Ask another owner." };
  const { data: before } = await supabaseAdmin().from("profiles").select("status, role, email").eq("id", userId).maybeSingle();
  if (!before) return { ok: false, message: "We could not find this account." };
  if (before.role === "admin" && !a.owner) return { ok: false, message: "Only an owner can change team accounts." };
  if (before.status === status) return { ok: true };
  const { error } = await a.sb.from("profiles").update({ status }).eq("id", userId);
  if (error) return { ok: false, message: "We could not change the status. Please try again." };
  const { error: banErr } = await supabaseAdmin().auth.admin.updateUserById(userId, { ban_duration: status === "active" ? "none" : BAN_FOREVER });
  if (banErr) {
    await a.sb.from("profiles").update({ status: before.status }).eq("id", userId);
    return { ok: false, message: "We could not lock the login. Nothing was changed. Please try again." };
  }
  await log(a.me.id, "account_status", userId, { email: before.email, from: before.status, to: status });
  return done();
}

// Approve or suspend a company. Approving sends the welcome email and the in app notice.
export async function setCompanyStatus(companyId: string, status: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(companyId) || !["approved", "suspended", "pending"].includes(status)) return { ok: false, message: "Something is wrong with this request." };
  const { data: c } = await a.sb.from("companies").select("id, name, status, approved_at").eq("id", companyId).maybeSingle();
  if (!c) return { ok: false, message: "We could not find this company." };
  if (c.status === status) return { ok: true };
  const patch: Record<string, unknown> = { status };
  if (status === "approved" && !c.approved_at) { patch.approved_at = new Date().toISOString(); patch.approved_by = a.me.id; }
  const { error } = await a.sb.from("companies").update(patch).eq("id", companyId);
  if (error) return { ok: false, message: "We could not change the company. Please try again." };
  if (status === "approved") await notifyCompanyApproved(companyId);
  await log(a.me.id, "company_status", companyId, { company: c.name, from: c.status, to: status });
  return done();
}

// Owner only: switch a team member between owner and staff.
export async function setAdminLevel(userId: string, level: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a?.owner) return { ok: false, message: "Only an owner can change team access." };
  if (!UUID.test(userId) || !["owner", "staff"].includes(level)) return { ok: false, message: "Something is wrong with this request." };
  if (userId === a.me.id) return { ok: false, message: "You cannot change your own access. Ask another owner." };
  const { data: p } = await supabaseAdmin().from("profiles").select("role, admin_level, email").eq("id", userId).maybeSingle();
  if (p?.role !== "admin") return { ok: false, message: "This account is not on the team." };
  const { error } = await a.sb.from("profiles").update({ admin_level: level }).eq("id", userId);
  if (error) return { ok: false, message: "We could not change the access. Please try again." };
  await log(a.me.id, "admin_level", userId, { email: p.email, from: p.admin_level, to: level });
  return done();
}

// Owner only: add a team member. They get an email and choose their own password.
export async function addTeamMember(input: { name: string; email: string; level: string }): Promise<Result> {
  const a = await requireAdmin();
  if (!a?.owner) return { ok: false, message: "Only an owner can add team members." };
  const name = String(input.name ?? "").trim().slice(0, 120);
  const email = String(input.email ?? "").trim().toLowerCase();
  const level = input.level === "owner" ? "owner" : "staff";
  if (name.length < 2) return { ok: false, message: "Enter their name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, message: "Enter a valid email address." };
  const db = supabaseAdmin();
  const { data: existing } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
  if (existing) return { ok: false, message: "This email already has an account. Use a different email for the team login." };
  const password = Buffer.from(crypto.getRandomValues(new Uint8Array(24))).toString("base64url");
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
  if (error || !data.user) return { ok: false, message: "We could not create the login. Please try again." };
  const id = data.user.id;
  await db.from("seeker_profiles").delete().eq("user_id", id);
  const { error: upErr } = await db.from("profiles").update({ role: "admin", admin_level: level, full_name: name, welcomed_at: new Date().toISOString() }).eq("id", id);
  if (upErr) { await db.auth.admin.deleteUser(id); return { ok: false, message: "We could not set up the team account. Please try again." }; }
  await sendEmail({ to: email, ...teamInvite({ name, by: a.me.full_name || "RemoteCore", level: level === "owner" ? "an owner" : "staff" }) });
  await log(a.me.id, "team_added", id, { email, level });
  return done(id);
}

async function removeFolder(bucket: string, uid: string) {
  const db = supabaseAdmin();
  const { data } = await db.storage.from(bucket).list(uid, { limit: 1000 });
  if (data?.length) await db.storage.from(bucket).remove(data.map((f) => `${uid}/${f.name}`));
}

// Owner only: delete an account for good, with its files. For an employer this also removes the company,
// its jobs and the applications to those jobs.
export async function deleteAccount(userId: string, confirm: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a?.owner) return { ok: false, message: "Only an owner can delete accounts." };
  if (!UUID.test(userId)) return { ok: false, message: "Something is wrong with this request." };
  if (String(confirm).trim().toUpperCase() !== "DELETE") return { ok: false, message: "Type DELETE to confirm." };
  if (userId === a.me.id) return { ok: false, message: "You cannot delete your own account." };
  const db = supabaseAdmin();
  const { data: p } = await db.from("profiles").select("email, role, full_name").eq("id", userId).maybeSingle();
  if (!p) return { ok: false, message: "We could not find this account." };
  // Jobs keep their author, so remove or hand them over first.
  const { data: company } = await db.from("companies").select("id, name").eq("owner_id", userId).maybeSingle();
  if (company) {
    const { error } = await db.from("jobs").delete().eq("company_id", company.id);
    if (error) return { ok: false, message: "We could not remove this company's jobs. Nothing was deleted." };
  }
  const { error: hand } = await db.from("jobs").update({ created_by: a.me.id }).eq("created_by", userId);
  if (hand) return { ok: false, message: "We could not hand over this person's jobs. Nothing was deleted." };
  if (company) await db.from("companies").delete().eq("id", company.id);
  await Promise.all(["resumes", "audio", "documents", "photos"].map((b) => removeFolder(b, userId)));
  const { error } = await db.auth.admin.deleteUser(userId);
  if (error) return { ok: false, message: "We could not delete the account. Please try again." };
  await log(a.me.id, "account_deleted", userId, { email: p.email, name: p.full_name, role: p.role, company: company?.name ?? null });
  return done();
}
