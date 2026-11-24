"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { autofillEnabled, extractFacts, resumeText } from "@/lib/resume/autofill";
import { COUNTRIES } from "@/lib/geo";

export type AutofillResult = { ok: boolean; filled: string[]; message?: string };

const cut = (v: string | null | undefined, max: number) => (v ? v.trim().slice(0, max) || null : null);
const day = (v: string | null | undefined) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
const yr = (v: number | null | undefined) => (v && v >= 1950 && v <= 2100 ? v : null);

// Runs right after a resume upload. Saves the resume text, then fills ONLY the profile parts that are
// still empty, so nothing the person typed is ever overwritten. They check and save each part after.
export async function autofillFromResume(): Promise<AutofillResult> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, filled: [], message: "Your session ended. Please log in again." };
  const uid = user.id;

  const { data: sp } = await sb.from("seeker_profiles").select("resume_path, headline, summary, years_experience").eq("user_id", uid).single();
  if (!sp?.resume_path) return { ok: false, filled: [] };
  const ext = String(sp.resume_path).split(".").pop()?.toLowerCase() ?? "";
  const { data: file } = await sb.storage.from("resumes").download(sp.resume_path);
  if (!file) return { ok: false, filled: [] };

  const text = await resumeText(file, ext);
  // The resume fills the saved profile, so an older typed draft must not hide it.
  await sb.from("seeker_profiles").update({ resume_text: text || null, draft: null, draft_at: null }).eq("user_id", uid);
  if (!autofillEnabled()) return { ok: true, filled: [] };
  if (!text) return { ok: true, filled: [], message: ext === "doc" ? "We can only read .docx and PDF files to fill your profile. Please fill it in below." : "We could not read the text in this file. Please fill your profile in below." };

  const f = await extractFacts(text);
  if (!f) return { ok: true, filled: [], message: "We could not read your resume this time. Please fill your profile in below." };

  const [{ data: prof }, work, edu, certs, skills, langs] = await Promise.all([
    sb.from("profiles").select("full_name, country").eq("id", uid).single(),
    sb.from("work_history").select("id", { count: "exact", head: true }).eq("user_id", uid),
    sb.from("education").select("id", { count: "exact", head: true }).eq("user_id", uid),
    sb.from("certifications").select("id", { count: "exact", head: true }).eq("user_id", uid),
    sb.from("seeker_skills").select("skill", { count: "exact", head: true }).eq("user_id", uid),
    sb.from("seeker_languages").select("language", { count: "exact", head: true }).eq("user_id", uid),
  ]);
  const filled: string[] = [];

  const p: Record<string, string> = {};
  if (!prof?.full_name && cut(f.full_name, 200)) p.full_name = cut(f.full_name, 200)!;
  const country = f.country ? COUNTRIES.find((c) => c.name.toLowerCase() === f.country!.trim().toLowerCase())?.name : undefined;
  if (!prof?.country && country) p.country = country;
  if (Object.keys(p).length) await sb.from("profiles").update(p).eq("id", uid);

  const s: Record<string, unknown> = {};
  if (!sp.headline && cut(f.headline, 120)) s.headline = cut(f.headline, 120);
  if (!sp.summary && cut(f.summary, 2000)) s.summary = cut(f.summary, 2000);
  if (sp.years_experience == null && f.years_experience != null && f.years_experience >= 0 && f.years_experience <= 60) s.years_experience = f.years_experience;
  if (Object.keys(s).length) await sb.from("seeker_profiles").update({ ...s, updated_at: new Date().toISOString() }).eq("user_id", uid);
  if (Object.keys(p).length || s.headline || s.summary) filled.push("About you");

  const add = async (count: number | null, table: string, rows: Record<string, unknown>[], label: string) => {
    if ((count ?? 0) > 0 || !rows.length) return;
    const { error } = await sb.from(table).insert(rows.map((r) => ({ ...r, user_id: uid })));
    if (error) console.error("[autofill]", table, error.message);
    else if (!filled.includes(label)) filled.push(label);
  };
  await add(work.count, "work_history", f.work.filter((w) => w.company && w.title).slice(0, 30).map((w) => ({
    company: cut(w.company, 150), title: cut(w.title, 150), start_date: day(w.start_date), end_date: day(w.end_date), description: cut(w.description, 2000),
  })), "Work history");
  await add(edu.count, "education", f.education.filter((e) => e.school).slice(0, 20).map((e) => ({
    school: cut(e.school, 150), degree: cut(e.degree, 150), field: cut(e.field, 150), start_year: yr(e.start_year), end_year: yr(e.end_year),
  })), "Education");
  await add(certs.count, "certifications", f.certifications.filter((c) => c.name).slice(0, 30).map((c) => ({
    name: cut(c.name, 150), issuer: cut(c.issuer, 150), year: yr(c.year),
  })), "Certifications");
  const uniqSkills = Array.from(new Set(f.skills.map((x) => x.trim().slice(0, 60)).filter(Boolean))).slice(0, 40);
  await add(skills.count, "seeker_skills", uniqSkills.map((skill) => ({ skill })), "Skills and languages");
  const uniqLangs = Array.from(new Map(f.languages.filter((l) => l.language.trim()).map((l) => [l.language.trim().toLowerCase(), { language: l.language.trim().slice(0, 60), level: l.level.toLowerCase() }])).values()).slice(0, 15);
  await add(langs.count, "seeker_languages", uniqLangs, "Skills and languages");

  revalidatePath("/portal/profile");
  return { ok: true, filled };
}
