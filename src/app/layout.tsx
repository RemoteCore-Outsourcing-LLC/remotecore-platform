import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemoteCore Outsourcing · Remote talent for employers, remote jobs for professionals",
  description:
    "RemoteCore Outsourcing connects employers in the United States and abroad with screened remote professionals from around the world. Hire talent or find remote work.",
  robots: { index: false, follow: false },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='12' fill='none' stroke='%23111735' stroke-width='3'/><circle cx='16' cy='16' r='5' fill='%232440E6'/></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="hire" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var v=new URLSearchParams(location.search).get('view');if(v==='jobseekers')document.documentElement.setAttribute('data-mode','work');})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600&family=Schibsted+Grotesk:wght@500;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/scrollcraft.css" />
        <link rel="stylesheet" href="/site.css" />
      </head>
      <body>
        {children}
        <Script src="/scrollcraft.js" strategy="afterInteractive" />
        <Script src="/site.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
