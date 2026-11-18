"use client";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const LINKS: Record<string, [string, string][]> = {
  job_seeker: [["/portal", "Dashboard"], ["/portal/jobs", "Jobs"], ["/portal/saved", "Saved"], ["/portal/applications", "Applications"], ["/portal/profile", "Profile"]],
  employer: [["/portal", "Dashboard"], ["/portal/postings", "Jobs"], ["/portal/requests", "Requests"], ["/portal/company", "Company"]],
  admin: [["/portal", "Dashboard"]],
};

export function PortalNav({ role, name, unread }: { role: string; name: string; unread: number }) {
  const path = usePathname();
  const here = (href: string) => (href === "/portal" ? path === href : path === href || path.startsWith(`${href}/`));
  async function logout() { await supabaseBrowser().auth.signOut(); location.href = "/"; }
  const links = LINKS[role] ?? [];
  return (
    <header className="pbar">
      <div className="pbar__in">
        <a className="pbar__logo" href="/" aria-label="RemoteCore Outsourcing, website">
          <img src="/brand/rco-mark.webp" width={240} height={123} alt="" />
          <span>RemoteCore</span>
        </a>
        <nav aria-label="Portal" className="pbar__nav">
          {links.map(([href, label]) => <a key={href} href={href} aria-current={here(href) ? "page" : undefined}>{label}</a>)}
        </nav>
        <div className="pbar__me">
          <a className="pbar__icon" href="/portal/notifications" aria-current={here("/portal/notifications") ? "page" : undefined} aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" /></svg>
            {unread > 0 && <b className="badge">{unread > 9 ? "9+" : unread}</b>}
          </a>
          <a className="pbar__icon" href="/portal/settings" aria-current={here("/portal/settings") ? "page" : undefined} aria-label="Settings" title={name}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4.5 20c1.2-3.6 4-5.3 7.5-5.3s6.3 1.7 7.5 5.3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </a>
          <button type="button" className="linkbtn" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
