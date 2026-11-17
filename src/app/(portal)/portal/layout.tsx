import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { PortalNav } from "@/components/portal/PortalNav";
import "./portal.css";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await getSession();
  if (!user || !profile) redirect("/login");
  if (profile.status !== "active") redirect("/login?error=suspended");
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Schibsted+Grotesk:wght@600;700;800&display=swap" rel="stylesheet" />
      <PortalNav role={profile.role} name={profile.full_name || profile.email} />
      <main className="pmain" id="main">{children}</main>
    </>
  );
}
