import type { Metadata, Viewport } from "next";
import "./globals.css";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: "Hire Remote Staff from $5/hr | Healthcare Admin, Customer Support & VAs | RemoteCore", template: "%s | RemoteCore Outsourcing" },
  description:
    "Hire pre-vetted remote professionals from the Caribbean, Latin America, the Philippines and Africa. One flat placement fee, no monthly markups, 60-day replacement guarantee.",
  // Keep search engines out until launch day. The launch step switches this on.
  robots: process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true" ? undefined : { index: false, follow: false },
  openGraph: { siteName: "RemoteCore Outsourcing", type: "website", images: ["/brand/rco-logo.webp"] },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#22123F" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
