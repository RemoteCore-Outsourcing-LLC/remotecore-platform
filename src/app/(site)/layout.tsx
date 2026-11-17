import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Engine } from "@/components/site/Engine";
import "./scrollcraft.css";
import "./site.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Schibsted+Grotesk:wght@500;700;800&display=swap" rel="stylesheet" />
      <a className="skip" href="#main">Skip to content</a>
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <Engine />
    </>
  );
}
