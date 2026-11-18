import "server-only";
import { unstable_cache } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { company as COMPANY } from "@/lib/site";
import { DEFAULT_FAQ, DEFAULT_MAIN, DEFAULT_MORE, type MainService, type MoreService } from "@/lib/content";
import { HERO_PAGES, type Hero } from "@/lib/heroes";

// Everything on the public site the team can change from the admin dashboard, with the built in text as the fallback.
export type CompanyInfo = { phone: string; email: string; address: string[]; socials: { label: string; href: string }[] };
export type Announcement = { active: boolean; text: string; link: string; linkLabel: string };
export type Settings = {
  company: CompanyInfo; announcement: Announcement; faq: [string, string][];
  services: { main: MainService[]; more: MoreService[] }; heroes: Record<string, Partial<Hero>>;
};

export const DEFAULTS: Settings = {
  company: { phone: COMPANY.phone, email: COMPANY.email, address: COMPANY.address, socials: COMPANY.socials },
  announcement: { active: false, text: "", link: "", linkLabel: "" },
  faq: DEFAULT_FAQ,
  services: { main: DEFAULT_MAIN, more: DEFAULT_MORE },
  heroes: {},
};
export const SETTINGS_TAG = "site-settings";

const load = unstable_cache(async (): Promise<Settings> => {
  const { data, error } = await supabaseAdmin().from("site_settings").select("key, value");
  if (error) return DEFAULTS;
  const m = new Map((data ?? []).map((r) => [r.key as string, r.value]));
  return {
    company: { ...DEFAULTS.company, ...(m.get("company") ?? {}) },
    announcement: { ...DEFAULTS.announcement, ...(m.get("announcement") ?? {}) },
    faq: Array.isArray(m.get("faq")) && m.get("faq").length ? m.get("faq") : DEFAULTS.faq,
    services: { ...DEFAULTS.services, ...(m.get("services") ?? {}) },
    heroes: m.get("heroes") ?? {},
  };
}, ["site-settings-v1"], { tags: [SETTINGS_TAG], revalidate: 600 });

export const getSettings = load;

// The heading of one public page: the team's text where they changed it, the built in text otherwise.
export async function heroFor(page: string): Promise<Hero> {
  const base = HERO_PAGES[page] ?? { title: "" };
  const o = (await load()).heroes[page] ?? {};
  return { eyebrow: base.eyebrow, title: o.title?.trim() || base.title, lede: o.lede?.trim() || base.lede };
}
