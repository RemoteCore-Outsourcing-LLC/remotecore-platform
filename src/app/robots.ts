import type { MetadataRoute } from "next";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";

// Until launch day (NEXT_PUBLIC_ALLOW_INDEXING=true) search engines are asked to stay out.
export default function robots(): MetadataRoute.Robots {
  if (process.env.NEXT_PUBLIC_ALLOW_INDEXING !== "true") return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/portal", "/api", "/auth", "/reset-password"] }],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
