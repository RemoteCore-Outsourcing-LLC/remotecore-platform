import { company } from "@/lib/site";
import { Logo } from "./Logo";

export function Footer() {
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
          </div>
          <div>
            <h4>For Businesses</h4>
            <ul>
              <li><a href="/services">Our Services</a></li>
              <li><a href="/talent-marketplace">Talent Marketplace</a></li>
              <li><a href="/hire-talent">Hire Talent</a></li>
              <li><a href="/book-consultation">Book a Consultation</a></li>
              <li><a href="/faq">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h4>For Professionals</h4>
            <ul>
              <li><a href="/find-opportunities">Find Opportunities</a></li>
              <li><a href="/learning-hub">Learning Hub</a></li>
              <li><a href="/career-services">Career Services</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/contact">Contact Us</a></li>
              <li><a href="/privacy">Privacy Policy</a></li>
              <li><a href="/terms">Terms of Use</a></li>
              {company.socials.map((s) => (
                <li key={s.href}><a href={s.href} rel="noopener" target="_blank">{s.label}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <p className="foot__base">© {year} RemoteCore Outsourcing. All rights reserved.</p>
      </div>
    </footer>
  );
}
