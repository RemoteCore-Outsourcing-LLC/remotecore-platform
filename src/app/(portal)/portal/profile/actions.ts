"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sections, type SectionKey } from "@/lib/portal/schema";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { profileProgress, PROFILE_SECTIONS } from "@/lib/portal/seeker";
import { notifyProfileSubmitted } from "@/lib/email/notify";

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string>; message?: string };

function flatten(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) { const k = i.path.join("."); if (!out[k]) out[k] = i.message; }
  return out;
}

type Sb = Awaited<ReturnType<typeof supabaseServer>>;

async function saveOne(sb: Sb, user: { id: string }, key: SectionKey, payload: unknown): Promise<SaveResult> {
  const parsed = sections[key].safeParse(payload);
  if (!parsed.success) return { ok: false, errors: flatten(parsed.error.issues), message: "Please fix the highlighted fields." };
  const d = parsed.data as never as Record<string, unknown>;
  const uid = user.id;
  const fail = (m: string) => ({ ok: false as const, errors: {}, message: m });

  const replaceList = async (table: string, rows: Record<string, unknown>[]) => {
    const del = await sb.from(table).delete().eq("user_id", uid);
    if (del.error) return del.error;
    if (!rows.length) return null;
    const ins = await sb.from(table).insert(rows.map((r) => ({ ...r, user_id: uid })));
    return ins.error;
  };

  let error: { message: string } | null = null;
  if (key === "about") {
    const { headline, summary, ...p } = d as { headline: string | null; summary: string | null; full_name: string; phone: string; country: string };
    error = (await sb.from("profiles").update(p).eq("id", uid)).error
      ?? (await sb.from("seeker_profiles").update({ headline, summary, updated_at: new Date().toISOString() }).eq("user_id", uid)).error;
  } else if (key === "work_prefs") {
    const v = d as Record<string, unknown>;
    const employment_types = (v.employment_types as string[]).map((s) => s.toLowerCase().replace(" ", "_"));
    error = (await sb.from("seeker_profiles").update({ ...v, employment_types, updated_at: new Date().toISOString() }).eq("user_id", uid)).error;
  } else if (key === "computer") {
    error = (await sb.from("computer_specs").upsert({ ...d, user_id: uid, updated_at: new Date().toISOString() })).error;
  } else if (key === "work") {
    error = await replaceList("work_history", d as never);
  } else if (key === "education") {
    error = await replaceList("education", d as never);
  } else if (key === "certs") {
    const v = d as { qualifications: string | null; items: Record<string, unknown>[] };
    error = (await sb.from("seeker_profiles").update({ qualifications: v.qualifications }).eq("user_id", uid)).error ?? (await replaceList("certifications", v.items));
  } else if (key === "skills") {
    const v = d as { skills: string[]; languages: { language: string; level: string }[] };
    const uniq = Array.from(new Set(v.skills.map((s) => s.trim()).filter(Boolean)));
    error = (await replaceList("seeker_skills", uniq.map((skill) => ({ skill }))))
      ?? (await replaceList("seeker_languages", Array.from(new Map(v.languages.map((l) => [l.language.toLowerCase(), { language: l.language, level: l.level.toLowerCase() }])).values())));
  }
  if (error) { console.error("[profile]", key, error.message); return fail("We could not save this. Please try again."); }
  return { ok: true };
}

export async function saveSection(key: SectionKey, payload: unknown): Promise<SaveResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, errors: {}, message: "Your session ended. Please log in again." };
  const r = await saveOne(sb, user, key, payload);
  revalidatePath("/portal/profile");
  return r;
}

export type SaveAllResult = {
  ok: boolean; message?: string;
  results: Partial<Record<SectionKey, SaveResult>>;
  missing: string[];          // labels of parts still to do
  submitted: boolean;         // true the first time the whole application is complete
};

// The one Save button: saves every part that is filled in correctly. The first time every part is
// complete, the application counts as submitted and the job seeker and the team get an email.
export async function saveProfile(all: Partial<Record<SectionKey, unknown>>): Promise<SaveAllResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Your session ended. Please log in again.", results: {}, missing: [], submitted: false };
  const results: Partial<Record<SectionKey, SaveResult>> = {};
  for (const key of Object.keys(all) as SectionKey[]) {
    if (!(key in sections) || key === "computer") continue;
    results[key] = await saveOne(sb, user, key, all[key]);
  }
  const bad = Object.values(results).some((r) => r && !r.ok);
  // Saved parts no longer need the draft. Keep the draft only while something could not be saved.
  if (!bad) await sb.from("seeker_profiles").update({ draft: null, draft_at: null }).eq("user_id", user.id);

  const { data: prof } = await sb.rpc("my_profile").maybeSingle<{ full_name?: string; phone?: string | null; country?: string | null }>();
  const progress = await profileProgress(sb, user.id, prof ?? {});
  const missing = PROFILE_SECTIONS.filter(([k]) => !progress.done[k]).map(([, label]) => label);
  let submitted = false;
  if (progress.complete) {
    const { data: stamped } = await supabaseAdmin().from("seeker_profiles")
      .update({ submitted_at: new Date().toISOString() }).eq("user_id", user.id).is("submitted_at", null).select("user_id").maybeSingle();
    if (stamped) { submitted = true; await notifyProfileSubmitted(user.id); }
  }
  revalidatePath("/portal", "layout");
  return { ok: !bad, message: bad ? "Some parts need a fix. Look for the red notes." : undefined, results, missing, submitted };
}

// Autosave: keeps what the job seeker typed, even before it is complete or correct.
export async function saveDraft(draft: unknown): Promise<{ ok: boolean }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false };
  const json = JSON.stringify(draft ?? null);
  if (json.length > 200_000) return { ok: false };
  const { error } = await sb.from("seeker_profiles").update({ draft: JSON.parse(json), draft_at: new Date().toISOString() }).eq("user_id", user.id);
  return { ok: !error };
}
