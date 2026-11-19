import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Profile } from "@/components/site/Marketplace";

const TYPE: Record<string, string> = { full_time: "Full time", part_time: "Part time", contract: "Contract", freelance: "Freelance" };

// The public card number. The team finds the candidate by it (search "RC-..." in admin candidates).
export const listingCode = (id: string) => `RC-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;

// Caribbean islands use America/ time zones, so they are listed by name first.
const CARIBBEAN = new Set(["Anguilla", "Antigua", "Aruba", "Barbados", "Cayman", "Curacao", "Dominica", "Grand_Turk", "Grenada", "Guadeloupe", "Havana", "Jamaica", "Kralendijk", "Lower_Princes", "Marigot", "Martinique", "Montserrat", "Nassau", "Port-au-Prince", "Port_of_Spain", "Puerto_Rico", "Santo_Domingo", "St_Barthelemy", "St_Kitts", "St_Lucia", "St_Thomas", "St_Vincent", "Tortola", "Guyana", "Paramaribo", "Belize"]);
function zone(tz: string | null) {
  if (!tz) return "Flexible";
  if (tz.startsWith("America/") && CARIBBEAN.has(tz.slice(8))) return "Caribbean";
  if (tz.startsWith("America/")) return "Americas / Latin America";
  if (tz.startsWith("Europe/") || tz.startsWith("Africa/") || tz.startsWith("Atlantic/")) return "Africa / Europe";
  if (tz.startsWith("Asia/") || tz.startsWith("Australia/") || tz.startsWith("Pacific/") || tz.startsWith("Indian/")) return "Asia Pacific / Philippines";
  return "Flexible";
}
function years(n: number | null) {
  if (n == null) return "New to remote work";
  if (n < 1) return "Under 1 year";
  if (n < 3) return "1 to 3 years";
  if (n <= 5) return "3 to 5 years";
  return "5+ years";
}

// Candidates an admin published, with their consent still on. Only public fields leave the database:
// first name and last initial, headline, summary, skills, languages. Never contact details or files.
export async function publishedListings(): Promise<Profile[]> {
  const db = supabaseAdmin();
  const { data } = await db.from("seeker_profiles")
    .select("user_id, headline, summary, years_experience, employment_types, preferred_categories, time_zone, profiles!inner(full_name, status)")
    .eq("marketplace_status", "published").eq("marketplace_consent", true).eq("profiles.status", "active").eq("profiles.role", "job_seeker")
    .order("marketplace_changed_at", { ascending: false, nullsFirst: false }).limit(200);
  const rows = data ?? [];
  if (!rows.length) return [];
  const ids = rows.map((r) => r.user_id as string);
  const [sk, lg] = await Promise.all([
    db.from("seeker_skills").select("user_id, skill").in("user_id", ids),
    db.from("seeker_languages").select("user_id, language").in("user_id", ids),
  ]);
  const by = (list: { user_id: string }[] | null, key: string) => {
    const m = new Map<string, string[]>();
    for (const r of list ?? []) m.set(r.user_id, [...(m.get(r.user_id) ?? []), (r as Record<string, string>)[key]]);
    return m;
  };
  const skills = by(sk.data as { user_id: string }[] | null, "skill");
  const langs = by(lg.data as { user_id: string }[] | null, "language");
  return rows.map((r) => {
    const who = r.profiles as unknown as { full_name: string };
    const parts = (who.full_name || "").trim().split(/\s+/);
    const name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0] || "Candidate";
    const summary = (r.summary as string | null)?.trim() ?? "";
    return {
      id: listingCode(r.user_id as string), name, role: (r.headline as string | null) || "Remote professional",
      specialty: (r.preferred_categories as string[] | null)?.[0] ?? "Remote Professional",
      summary: summary.length > 180 ? `${summary.slice(0, 177).trimEnd()}...` : summary,
      years: years(r.years_experience as number | null), skills: (skills.get(r.user_id as string) ?? []).slice(0, 6),
      availability: TYPE[(r.employment_types as string[] | null)?.[0] ?? ""] ?? "Flexible", zone: zone(r.time_zone as string | null),
      languages: langs.get(r.user_id as string) ?? [],
    };
  });
}
