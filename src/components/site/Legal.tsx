import { getSettings } from "@/lib/settings";

// Shared layout and contact block for the Privacy Policy and Terms of Use.
// Draft text for RemoteCore's own lawyer to review before launch.
export const LEGAL_UPDATED = "December 2026";

export function LegalBody({ children }: { children: React.ReactNode }) {
  return (
    <section className="sec legal-sec">
      <div className="wrap legal">{children}</div>
    </section>
  );
}

export async function LegalContact() {
  const { company } = await getSettings();
  return (
    <address className="legal__contact">
      RemoteCore Outsourcing LLC<br />
      {company.address.map((l) => <span key={l}>{l}<br /></span>)}
      {company.email ? <>Email: <a href={`mailto:${company.email}`}>{company.email}</a><br /></> : null}
      {company.phone ? <>Phone: {company.phone}<br /></> : null}
      Or use our <a href="/contact">contact form</a>.
    </address>
  );
}
