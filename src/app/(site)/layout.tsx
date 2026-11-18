import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Engine } from "@/components/site/Engine";
import { getSettings } from "@/lib/settings";
import "./scrollcraft.css";
import "./site.css";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { announcement: a } = await getSettings();
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Schibsted+Grotesk:wght@500;700;800&display=swap" rel="stylesheet" />
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
    </>
  );
}
