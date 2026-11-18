import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { getSettings } from "@/lib/settings";
import { HERO_PAGES } from "@/lib/heroes";
import { SERVICE_ICONS } from "@/lib/content";
import { PageHead } from "@/components/portal/Dash";
import { CompanyEditor, AnnouncementEditor, FaqEditor, ServicesEditor, HeroEditor } from "@/components/portal/SiteClient";

export const metadata: Metadata = { title: "Website", robots: { index: false } };
export const dynamic = "force-dynamic";

const SECTIONS = [["company", "Company details"], ["announcement", "Announcement"], ["headings", "Page headings"], ["services", "Services"], ["faq", "FAQ"]] as const;

export default async function Website() {
  const { admin } = await getAdmin();
  if (!admin) notFound();
  const s = await getSettings();
  const pages = Object.entries(HERO_PAGES).map(([key, p]) => ({ key, label: p.label, path: p.path, title: p.title, lede: p.lede }));
  return (
    <div className="pwrap">
      <PageHead title="Website" sub="Change the text on the public website. Saved changes show on the site within a few seconds." aside={<a className="btn btn--ghost btn--sm" href="/" target="_blank" rel="noopener noreferrer">Open the website</a>} />
      <div className="pedit">
        <aside className="pedit__nav"><nav aria-label="Website sections">{SECTIONS.map(([k, l]) => <a key={k} href={`#${k}`}>{l}</a>)}</nav></aside>
        <div className="pedit__main stack">
          <section className="psec" id="company" aria-labelledby="company-h">
            <header className="psec__head"><h2 id="company-h">Company details</h2></header>
            <p className="psec__intro">Shown in the footer of every page and on the Contact page.</p>
            <CompanyEditor initial={s.company} />
          </section>
          <section className="psec" id="announcement" aria-labelledby="ann-h">
            <header className="psec__head"><h2 id="ann-h">Announcement</h2></header>
            <p className="psec__intro">A short line in a bar at the top of every public page. Turn it off when it is no longer needed.</p>
            <AnnouncementEditor initial={s.announcement} />
          </section>
          <section className="psec" id="headings" aria-labelledby="hero-h">
            <header className="psec__head"><h2 id="hero-h">Page headings</h2></header>
            <HeroEditor pages={pages} initial={s.heroes} />
          </section>
          <section className="psec" id="services" aria-labelledby="svc-h">
            <header className="psec__head"><h2 id="svc-h">Services</h2></header>
            <ServicesEditor initial={s.services} icons={SERVICE_ICONS} />
          </section>
          <section className="psec" id="faq" aria-labelledby="faq-h">
            <header className="psec__head"><h2 id="faq-h">FAQ</h2></header>
            <p className="psec__intro">The questions on the FAQs page, in this order. Search engines read them too.</p>
            <FaqEditor initial={s.faq} />
          </section>
        </div>
      </div>
    </div>
  );
}
