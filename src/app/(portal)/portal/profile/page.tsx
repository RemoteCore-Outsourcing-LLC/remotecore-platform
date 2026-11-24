import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { ProfileEditor, type ProfileData, type ProfileDraft } from "@/components/portal/ProfileEditor";
import { MediaSection } from "@/components/portal/MediaSection";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const cap = (v: string) => v.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default async function ProfilePage() {
  const { sb, user, profile } = await getSession();
  if (profile?.role === "employer") redirect("/portal/company");
  if (!user || !profile) return null;
  const [sp, work, edu, certs, skills, langs, cats] = await Promise.all([
    sb.from("seeker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("work_history").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    sb.from("education").select("*").eq("user_id", user.id).order("end_year", { ascending: false }),
    sb.from("certifications").select("*").eq("user_id", user.id).order("year", { ascending: false }),
    sb.from("seeker_skills").select("skill").eq("user_id", user.id),
    sb.from("seeker_languages").select("*").eq("user_id", user.id),
    sb.from("job_categories").select("name").order("sort"),
  ]);
  const p = sp.data ?? {};
  const [dial, ...rest] = s(profile.phone).split(" ");
  const saved: ProfileData = {
    about: { full_name: s(profile.full_name), dial: dial?.startsWith("+") ? dial : "+1", phone: dial?.startsWith("+") ? rest.join("") : s(profile.phone), country: s(profile.country), headline: s(p.headline), summary: s(p.summary) },
    work_prefs: {
      expected_salary: s(p.expected_salary), salary_currency: s(p.salary_currency) || "USD",
      employment_types: arr(p.employment_types).map(cap), preferred_categories: arr(p.preferred_categories),
      available_from: s(p.available_from), preferred_hours: s(p.preferred_hours), time_zone: s(p.time_zone), years_experience: s(p.years_experience),
    },
    work: (work.data ?? []).map((w) => ({ company: s(w.company), title: s(w.title), start_date: s(w.start_date), end_date: s(w.end_date), description: s(w.description) })),
    education: (edu.data ?? []).map((e) => ({ school: s(e.school), degree: s(e.degree), field: s(e.field), start_year: s(e.start_year), end_year: s(e.end_year) })),
    certs: { qualifications: s(p.qualifications), items: (certs.data ?? []).map((x) => ({ name: s(x.name), issuer: s(x.issuer), year: s(x.year) })) },
    skills: { skills: (skills.data ?? []).map((x) => x.skill).join(", "), languages: (langs.data ?? []).map((l) => ({ language: s(l.language), level: cap(s(l.level)) })) },
  };
  // A draft newer than the last save wins, so nothing typed is lost (autosave).
  const d = p.draft as ProfileDraft | null;
  const useDraft = !!d && !!p.draft_at && (!p.updated_at || p.draft_at > p.updated_at);
  const initial: ProfileData = useDraft && d
    ? { about: d.about, work_prefs: d.prefs, work: d.work, education: d.edu, certs: d.certs, skills: d.sk }
    : saved;

  // Short lived links to the user's own private files (10 minutes).
  const sign = async (bucket: string, path: unknown) => {
    if (!path) return null;
    const { data } = await sb.storage.from(bucket).createSignedUrl(String(path), 600);
    return data?.signedUrl ?? null;
  };
  const [resumeUrl, audioUrl] = await Promise.all([sign("resumes", p.resume_path), sign("audio", p.audio_path)]);
  const resume = resumeUrl ? { name: `Your resume (${String(p.resume_path).split(".").pop()?.toUpperCase()})`, url: resumeUrl } : null;
  const audio = audioUrl ? { url: audioUrl } : null;

  return (
    <div className="pwrap">
      <header className="phead">
        <h1>My profile</h1>
        <p>This is your application to RemoteCore. Fill in each part, then press Submit application at the bottom. We keep your answers as you type.</p>
      </header>
      <ProfileEditor saved={saved} draftAt={useDraft ? String(p.draft_at) : null} savedAt={p.updated_at ? String(p.updated_at) : null} submitted={!!p.submitted_at} media={<MediaSection userId={user.id} resume={resume} audio={audio} />} mediaDone={!!resume && !!audio} initial={initial} categories={(cats.data ?? []).map((x) => x.name)} email={s(profile.email)} />
    </div>
  );
}
