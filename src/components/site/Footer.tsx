import { company as base } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import { Logo } from "./Logo";

export async function Footer() {
  const company = { ...base, ...(await getSettings()).company };
  const year = new Date().getFullYear();
  return (
    <footer className="foot">
      <div className="wrap">
        <div className="foot__grid">
          <div className="foot__brand">
            <Logo />
            <p>{company.tagline}</p>
            <address>
              {company.address.map((l) => (
                <span key={l}>{l}<br /></span>
              ))}
              {company.email && <><a href={`mailto:${company.email}`}>{company.email}</a><br /></>}
              {company.phone && <a href={`tel:${company.phone.replace(/[^+\d]/g, "")}`}>{company.phone}</a>}
            </address>
            {company.socials.length > 0 && (
              <ul className="foot__social" aria-label="RemoteCore on social media">
                {company.socials.map((s) => (
                  <li key={s.href}><a href={s.href} rel="noopener noreferrer" target="_blank" aria-label={`${s.label} (opens in a new tab)`}><SocialIcon name={s.label} /></a></li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h2 className="foot__h">For Businesses</h2>
            <ul>
              <li><a href="/services">Our Services</a></li>
              <li><a href="/talent-marketplace">Talent Marketplace</a></li>
              <li><a href="/hire-talent">Hire Talent</a></li>
              <li><a href="/book-consultation">Book a Consultation</a></li>
              <li><a href="/faq">FAQs</a></li>
              <li><a href="/register/employer">Create a Company Account</a></li>
            </ul>
          </div>
          <div>
            <h2 className="foot__h">For Professionals</h2>
            <ul>
              <li><a href="/find-opportunities">Find Opportunities</a></li>
              <li><a href="/learning-hub">Learning Hub</a></li>
              <li><a href="/career-services">Career Services</a></li>
              <li><a href="/register/job-seeker">Join as a Job Seeker</a></li>
              <li><a href="/login">Log In</a></li>
            </ul>
          </div>
          <div>
            <h2 className="foot__h">Company</h2>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
            </ul>
          </div>
        </div>
        <p className="foot__base">© {year} RemoteCore Outsourcing. All rights reserved.</p>
      </div>
    </footer>
  );
}

// Simple outline marks, drawn here so the footer loads no outside images.
function SocialIcon({ name }: { name: string }) {
  const d: Record<string, React.ReactNode> = {
    LinkedIn: <><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" /></>,
    Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5v.01" /></>,
    TikTok: <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5M14 3c.5 2.6 2.2 4.2 5 4.5" />,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d[name]}</svg>;
}
