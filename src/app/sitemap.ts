import type { MetadataRoute } from "next";
import { hasDbKeys, supabaseAdmin } from "@/lib/supabase/admin";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";
export const revalidate = 3600;

const PAGES: [string, number][] = [
  ["/", 1], ["/hire-talent", 0.9], ["/find-opportunities", 0.9], ["/services", 0.8], ["/talent-marketplace", 0.8],
  ["/about", 0.7], ["/career-services", 0.6], ["/learning-hub", 0.6], ["/book-consultation", 0.6], ["/contact", 0.6],
  ["/faq", 0.5], ["/register", 0.4], ["/privacy", 0.2], ["/terms", 0.2],
];

// Every public page plus every live job.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const { data: jobs } = hasDbKeys()
    ? await supabaseAdmin().from("jobs").select("id, updated_at").eq("status", "published").limit(5000)
    : { data: [] as { id: string; updated_at: string }[] };
  return [
    ...PAGES.map(([path, priority]) => ({ url: `${site}${path}`, lastModified: now, priority })),
    ...(jobs ?? []).map((j) => ({ url: `${site}/jobs/${j.id}`, lastModified: new Date(j.updated_at), priority: 0.7 })),
  ];
}
