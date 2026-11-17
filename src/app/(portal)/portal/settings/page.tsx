import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { shortDate } from "@/lib/portal/seeker";
import { PageHead } from "@/components/portal/Dash";
import { PasswordForm, MarketplaceToggle, DeleteAccount } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const { sb, user, profile } = await getSession();
  if (!user || !profile) return null;
  const { data: sp } = await sb.from("seeker_profiles").select("marketplace_consent, marketplace_consent_at, marketplace_status").eq("user_id", user.id).maybeSingle();
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Settings" sub="Your login, privacy and account." />
      <div className="stack">
        <section className="psec" aria-labelledby="acc-h">
          <header className="psec__head"><h2 id="acc-h">Login</h2></header>
          <div className="psec__body">
            <dl className="facts">
              <dt>Email</dt><dd>{profile.email}</dd>
              <dt>Member since</dt><dd>{shortDate(profile.created_at)}</dd>
            </dl>
            <p className="soft small">To change your email address, contact RemoteCore.</p>
          </div>
        </section>
        <section className="psec" aria-labelledby="pw-h">
          <header className="psec__head"><h2 id="pw-h">Password</h2></header>
          <PasswordForm />
        </section>
        {profile.role === "job_seeker" && (
          <section className="psec" aria-labelledby="mk-h">
            <header className="psec__head"><h2 id="mk-h">Privacy</h2></header>
            <MarketplaceToggle consent={!!sp?.marketplace_consent} status={sp?.marketplace_status ?? "hidden"} since={sp?.marketplace_consent_at ? shortDate(sp.marketplace_consent_at) : null} />
          </section>
        )}
        {profile.role === "job_seeker" && (
          <section className="psec psec--danger" aria-labelledby="del-h">
            <header className="psec__head"><h2 id="del-h">Delete account</h2></header>
            <DeleteAccount />
          </section>
        )}
      </div>
    </div>
  );
}
