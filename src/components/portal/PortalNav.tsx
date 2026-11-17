"use client";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/browser";

const LINKS: Record<string, [string, string][]> = {
  job_seeker: [["/portal/profile", "My profile"]],
  employer: [["/portal", "Dashboard"]],
  admin: [["/portal", "Dashboard"]],
};

export function PortalNav({ role, name }: { role: string; name: string }) {
  const path = usePathname();
  async function logout() { await supabaseBrowser().auth.signOut(); location.href = "/"; }
  return (
    <header className="pbar">
      <div className="pbar__in">
        <a className="pbar__logo" href="/" aria-label="RemoteCore Outsourcing, website">
          <img src="/brand/rco-mark.webp" width={240} height={123} alt="" />
          <span>RemoteCore</span>
        </a>
        <nav aria-label="Portal">
          {(LINKS[role] ?? []).map(([href, label]) => <a key={href} href={href} aria-current={path === href ? "page" : undefined}>{label}</a>)}
        </nav>
        <div className="pbar__me">
          <span title={name}>{name}</span>
          <button type="button" className="linkbtn" onClick={logout}>Log out</button>
        </div>
      </div>
    </header>
  );
}
