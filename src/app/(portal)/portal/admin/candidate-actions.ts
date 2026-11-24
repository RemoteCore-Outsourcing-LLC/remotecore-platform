"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

type Result = { ok: boolean; message?: string; url?: string };
const UUID = /^[0-9a-f-]{36}$/i;
const LINK_SECONDS = 300;

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
const refresh = (id: string) => { revalidatePath(`/portal/admin/candidates/${id}`); revalidatePath("/portal/admin/candidates"); };

// A 5 minute link to a candidate's resume, voice intro, or a document sent with one application.
export async function openSeekerFile(seekerId: string, kind: "resume" | "audio" | "document", appId?: string, index = 0): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(seekerId)) return { ok: false, message: "Something is wrong with this request." };
  let bucket = "", path: string | null = null;
  if (kind === "document") {
    if (!appId || !UUID.test(appId)) return { ok: false, message: "Something is wrong with this request." };
    const { data: app } = await a.sb.from("applications").select("extra_documents, seeker_id").eq("id", appId).maybeSingle();
    if (app?.seeker_id !== seekerId) return { ok: false, message: "We could not find this file." };
    bucket = "documents";
    path = Number.isInteger(index) && index >= 0 ? app.extra_documents?.[index] ?? null : null;
  } else {
    const { data: sp } = await a.sb.from("seeker_profiles").select("resume_path, audio_path").eq("user_id", seekerId).maybeSingle();
    bucket = kind === "resume" ? "resumes" : "audio";
    path = kind === "resume" ? sp?.resume_path ?? null : sp?.audio_path ?? null;
  }
  if (!path || !path.startsWith(`${seekerId}/`) || path.includes("..")) return { ok: false, message: "This file is not there any more." };
  const { data, error } = await supabaseAdmin().storage.from(bucket).createSignedUrl(path, LINK_SECONDS);
  if (error || !data?.signedUrl) return { ok: false, message: "This file is not there any more." };
  return { ok: true, url: data.signedUrl };
}

const cleanTag = (t: string) => String(t ?? "").trim().replace(/\s+/g, " ").slice(0, 40);

export async function addTag(seekerId: string, tag: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const t = cleanTag(tag);
  if (!UUID.test(seekerId) || !t) return { ok: false, message: "Enter a tag." };
  const { error } = await a.sb.from("candidate_tags").upsert({ seeker_id: seekerId, tag: t, created_by: a.me.id }, { onConflict: "seeker_id,tag", ignoreDuplicates: true });
  if (error) return { ok: false, message: "We could not add the tag. Please try again." };
  refresh(seekerId);
  return { ok: true };
}

export async function removeTag(seekerId: string, tag: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(seekerId)) return { ok: false, message: "Something is wrong with this request." };
  const { error } = await a.sb.from("candidate_tags").delete().eq("seeker_id", seekerId).eq("tag", cleanTag(tag));
  if (error) return { ok: false, message: "We could not remove the tag. Please try again." };
  refresh(seekerId);
  return { ok: true };
}

export async function addNote(seekerId: string, body: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const text = String(body ?? "").trim();
  if (!UUID.test(seekerId) || text.length < 2) return { ok: false, message: "Write the note first." };
  if (text.length > 4000) return { ok: false, message: "Please keep notes under 4,000 characters." };
  const { error } = await a.sb.from("candidate_notes").insert({ seeker_id: seekerId, author_id: a.me.id, body: text });
  if (error) return { ok: false, message: "We could not save the note. Please try again." };
  refresh(seekerId);
  return { ok: true };
}

export async function deleteNote(noteId: string, seekerId: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(noteId) || !UUID.test(seekerId)) return { ok: false, message: "Something is wrong with this request." };
  const { error } = await a.sb.from("candidate_notes").delete().eq("id", noteId).eq("seeker_id", seekerId);
  if (error) return { ok: false, message: "We could not delete the note." };
  refresh(seekerId);
  return { ok: true };
}

// Publish a listing on the public Talent Marketplace (only with the candidate's consent), or take it down.
export async function setListing(seekerId: string, publish: boolean): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(seekerId)) return { ok: false, message: "Something is wrong with this request." };
  const { data: sp } = await a.sb.from("seeker_profiles").select("marketplace_consent, marketplace_status").eq("user_id", seekerId).maybeSingle();
  if (!sp) return { ok: false, message: "We could not find this candidate." };
  if (publish && !sp.marketplace_consent) return { ok: false, message: "This candidate has not agreed to be listed. They can turn it on in their settings." };
  const status = publish ? "published" : sp.marketplace_consent ? "pending" : "hidden";
  const { error } = await a.sb.from("seeker_profiles").update({ marketplace_status: status, marketplace_changed_at: new Date().toISOString() }).eq("user_id", seekerId);
  if (error) return { ok: false, message: "We could not change the listing. Please try again." };
  await log(a.me.id, "marketplace", seekerId, { from: sp.marketplace_status, to: status });
  refresh(seekerId);
  revalidatePath("/talent-marketplace");
  return { ok: true };
}

/* ---------- Stage and interviews (call 2026-11-23) ---------- */

const STAGES = ["new", "shortlisted", "interview", "approved", "not_a_fit"] as const;

// The team's own stage for a candidate, with or without a job application.
// Shortlisting sends the "pick your interview time" email when interview booking is on.
export async function setStage(seekerId: string, stage: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(seekerId) || !(STAGES as readonly string[]).includes(stage)) return { ok: false, message: "Something is wrong with this request." };
  const { error } = await supabaseAdmin().from("seeker_profiles").update({ stage }).eq("user_id", seekerId);
  if (error) return { ok: false, message: "We could not save the stage. Please try again." };
  await log(a.me.id, "candidate_stage", seekerId, { stage });
  let message: string | undefined;
  if (stage === "shortlisted") {
    const { inviteToInterview } = await import("@/lib/interviews");
    const r = await inviteToInterview(seekerId, { by: a.me.id });
    message = r.ok ? "Shortlisted. We emailed them a link to pick an interview time." : r.reason === "open" ? "Shortlisted. They already have an interview invite." : "Shortlisted. Interview booking is off, so no invite went out.";
  }
  refresh(seekerId);
  return { ok: true, message };
}

// Send the interview invite by hand (also works when automatic invites are off).
export async function sendInterviewInvite(seekerId: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(seekerId)) return { ok: false, message: "Something is wrong with this request." };
  const { inviteToInterview } = await import("@/lib/interviews");
  const r = await inviteToInterview(seekerId, { by: a.me.id, force: true });
  if (!r.ok) return { ok: false, message: r.reason === "open" ? "They already have an open invite or a booked interview." : r.reason === "off" ? "Turn on interview booking first, in Admin, Interviews." : "Please try again." };
  await log(a.me.id, "interview_invite", seekerId, {});
  refresh(seekerId);
  return { ok: true };
}

// Close an interview: cancelled (frees the time), done, or did not show up.
export async function closeInterview(interviewId: string, status: "cancelled" | "done" | "no_show"): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(interviewId) || !["cancelled", "done", "no_show"].includes(status)) return { ok: false, message: "Something is wrong with this request." };
  const { data } = await supabaseAdmin().from("interviews").update({ status }).eq("id", interviewId).in("status", ["invited", "booked"]).select("seeker_id").maybeSingle();
  if (!data) return { ok: false, message: "This interview is already closed." };
  await log(a.me.id, "interview_" + status, data.seeker_id, { interviewId });
  refresh(data.seeker_id);
  revalidatePath("/portal/admin/interviews");
  return { ok: true };
}
