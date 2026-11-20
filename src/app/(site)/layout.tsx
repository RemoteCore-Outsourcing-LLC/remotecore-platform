import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Engine } from "@/components/site/Engine";
import { getSettings } from "@/lib/settings";
import { company as base } from "@/lib/site";
import { geist, schibsted } from "@/lib/fonts";
import "./scrollcraft.css";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { announcement: a, company: c } = await getSettings();
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";
  // Who the company is, for search engines and AI answers.
  const org = {
    "@context": "https://schema.org", "@type": "EmploymentAgency", name: base.name, alternateName: base.short, url: site,
    logo: `${site}/brand/rco-logo.webp`, slogan: base.tagline,
    address: { "@type": "PostalAddress", streetAddress: c.address[0], addressLocality: c.address[1]?.split(",")[0], addressRegion: c.address[1]?.split(",")[1]?.trim().split(" ")[0], postalCode: c.address[1]?.split(" ").pop(), addressCountry: "US" },
    ...(c.email ? { email: c.email } : {}), ...(c.phone ? { telephone: c.phone } : {}),
    sameAs: c.socials.map((x) => x.href),
  };
  return (
    <>
      <style>{`html:root{--sc-font-text:${geist.style.fontFamily};--sc-font-display:${schibsted.style.fontFamily}}`}</style>
      <a className="skip" href="#main">Skip to content</a>
      {a.active && a.text && (
        <div className="announce" role="region" aria-label="Announcement">
          <p>{a.text}{a.link && <> <a href={a.link}>{a.linkLabel || "Learn more"}</a></>}</p>
        </div>
      )}
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Engine />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org).replace(/</g, "\\u003c") }} />
    </>
  );
}
