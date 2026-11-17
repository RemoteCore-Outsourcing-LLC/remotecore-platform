"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sections, type SectionKey } from "@/lib/portal/schema";

export type SaveResult = { ok: true } | { ok: false; errors: Record<string, string>; message?: string };

function flatten(issues: { path: (string | number)[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const i of issues) { const k = i.path.join("."); if (!out[k]) out[k] = i.message; }
  return out;
}

export async function saveSection(key: SectionKey, payload: unknown): Promise<SaveResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, errors: {}, message: "Your session ended. Please log in again." };
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
  revalidatePath("/portal/profile");
  return { ok: true };
}
