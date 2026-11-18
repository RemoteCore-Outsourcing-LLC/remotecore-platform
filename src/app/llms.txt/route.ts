import { getSettings } from "@/lib/settings";
import { company } from "@/lib/site";
import { supabaseAdmin } from "@/lib/supabase/admin";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";
export const revalidate = 3600;

// A plain text summary for AI assistants and answer engines (the llms.txt convention), built from the site's own text.
export async function GET() {
  const s = await getSettings();
  const { data: jobs } = await supabaseAdmin().from("jobs").select("id, title").eq("status", "published").order("published_at", { ascending: false }).limit(50);
  const lines = [
    `# ${company.name}`,
    "",
    `> ${company.tagline} ${company.short} connects businesses with screened remote professionals for healthcare administration, customer support, virtual assistance, sales support and other business roles, and helps job seekers find remote work.`,
    "",
    "## For businesses",
    `- [Hire Talent](${site}/hire-talent): request remote professionals for a role.`,
    `- [Our Services](${site}/services): the roles we recruit for.`,
    `- [Talent Marketplace](${site}/talent-marketplace): browse profiles and request an introduction.`,
    `- [Book a Consultation](${site}/book-consultation)`,
    "",
    "## Services",
    ...s.services.main.map((m) => `- ${m.name}: ${m.items.slice(0, 6).join(", ")}.`),
    ...s.services.more.map((m) => `- ${m.name}: ${m.text}`),
    "",
    "## For job seekers",
    `- [Find Opportunities](${site}/find-opportunities): join the talent network and see open remote jobs.`,
    `- [Career Services](${site}/career-services) and [Learning Hub](${site}/learning-hub).`,
    `- [Create an account](${site}/register)`,
    ...(jobs?.length ? ["", "## Open jobs", ...jobs.map((j) => `- [${j.title}](${site}/jobs/${j.id})`)] : []),
    "",
    "## Questions",
    ...s.faq.map(([q, a]) => `- ${q} ${a}`),
    "",
    "## Contact",
    `- [Contact page](${site}/contact)`,
    ...(s.company.email ? [`- Email: ${s.company.email}`] : []),
    ...(s.company.phone ? [`- Phone: ${s.company.phone}`] : []),
    `- Address: ${s.company.address.join(", ")}`,
    ...s.company.socials.map((x) => `- ${x.label}: ${x.href}`),
    "",
  ];
  return new Response(lines.join("\n"), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
