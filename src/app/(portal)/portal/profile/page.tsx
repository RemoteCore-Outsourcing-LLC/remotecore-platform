import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { ProfileEditor, type ProfileData } from "@/components/portal/ProfileEditor";

export const metadata: Metadata = { title: "My profile", robots: { index: false } };

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);
const cap = (v: string) => v.replace("_", " ").replace(/^\w/, (c) => c.toUpperCase());

export default async function ProfilePage() {
  const { sb, user, profile } = await getSession();
  if (!user || !profile) return null;
  const [sp, pc, work, edu, certs, skills, langs, cats] = await Promise.all([
    sb.from("seeker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("computer_specs").select("*").eq("user_id", user.id).maybeSingle(),
    sb.from("work_history").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    sb.from("education").select("*").eq("user_id", user.id).order("end_year", { ascending: false }),
    sb.from("certifications").select("*").eq("user_id", user.id).order("year", { ascending: false }),
    sb.from("seeker_skills").select("skill").eq("user_id", user.id),
    sb.from("seeker_languages").select("*").eq("user_id", user.id),
    sb.from("job_categories").select("name").order("sort"),
  ]);
  const p = sp.data ?? {};
  const c = pc.data ?? {};
  const [dial, ...rest] = s(profile.phone).split(" ");
  const initial: ProfileData = {
    about: { full_name: s(profile.full_name), dial: dial?.startsWith("+") ? dial : "+1", phone: dial?.startsWith("+") ? rest.join("") : s(profile.phone), country: s(profile.country), headline: s(p.headline), summary: s(p.summary) },
    work_prefs: {
      expected_salary: s(p.expected_salary), salary_currency: s(p.salary_currency) || "USD",
      employment_types: arr(p.employment_types).map(cap), preferred_categories: arr(p.preferred_categories),
      available_from: s(p.available_from), preferred_hours: s(p.preferred_hours), time_zone: s(p.time_zone), years_experience: s(p.years_experience),
    },
    computer: {
      computer_type: s(c.computer_type), operating_system: s(c.operating_system), processor: s(c.processor), ram: s(c.ram), storage: s(c.storage),
      connection_type: s(c.connection_type), download_mbps: s(c.download_mbps), upload_mbps: s(c.upload_mbps),
      has_webcam: c.has_webcam === false ? "no" : "yes", has_microphone: c.has_microphone === false ? "no" : "yes", other_equipment: s(c.other_equipment),
    },
    work: (work.data ?? []).map((w) => ({ company: s(w.company), title: s(w.title), start_date: s(w.start_date), end_date: s(w.end_date), description: s(w.description) })),
    education: (edu.data ?? []).map((e) => ({ school: s(e.school), degree: s(e.degree), field: s(e.field), start_year: s(e.start_year), end_year: s(e.end_year) })),
    certs: { qualifications: s(p.qualifications), items: (certs.data ?? []).map((x) => ({ name: s(x.name), issuer: s(x.issuer), year: s(x.year) })) },
    skills: { skills: (skills.data ?? []).map((x) => x.skill).join(", "), languages: (langs.data ?? []).map((l) => ({ language: s(l.language), level: cap(s(l.level)) })) },
  };
  return (
    <div className="pwrap">
      <header className="phead">
        <h1>My profile</h1>
        <p>Employers see this when you apply. Save each part as you go.</p>
      </header>
      <ProfileEditor initial={initial} categories={(cats.data ?? []).map((x) => x.name)} email={s(profile.email)} />
    </div>
  );
}
