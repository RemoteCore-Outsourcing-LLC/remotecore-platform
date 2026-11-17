import type { Metadata } from "next";
import { Consent, Field, Form, Select } from "@/components/site/Form";
import { talentCategories } from "@/lib/site";

export const metadata: Metadata = { title: "Book a Consultation", description: "Tell us about your staffing needs. Our team will contact you to talk through the right remote talent for your business." };

const points = [
  ["Access Skilled Remote Professionals", "M13 2L4 14h7l-1 8 9-12h-7z"],
  ["Save Time & Reduce Costs", "M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z"],
  ["Scale Your Team Globally", "M3 17l6-6 4 4 8-8M15 7h6v6"],
  ["Partner with a Trusted Outsourcing Expert", "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2 2 4-4"],
];

export default function BookConsultation() {
  return (
    <section className="phero" style={{ paddingBottom: "clamp(56px, 8vw, 110px)" }}>
      <div className="wrap split split--top">
        <div>
          <p className="eyebrow">For businesses & companies</p>
          <h1>Book a Consultation</h1>
          <p className="lede">Let us help you find the right remote talent for your business. Tell us what you need and our team will contact you with a personalized solution.</p>
          <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "grid", gap: 16 }}>
            {points.map(([t, d]) => (
              <li key={t} style={{ display: "flex", gap: 14, alignItems: "center", fontWeight: 600, fontSize: 17 }}>
                <span style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(111,216,206,.14)", color: "var(--teal-light)", display: "grid", placeItems: "center", flex: "none" }} aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <div className="panel">
          <h2>Tell Us About Your Needs</h2>
          <p>Fill out the form and our team will contact you shortly.</p>
          <Form kind="consultation" submitLabel="Book a Consultation" thanksTitle="Request received." thanksText="Thank you for contacting RemoteCore. Our team will review your needs and contact you to schedule your consultation." note="Your information is secure and will never be shared.">
            <Field label="Company name" name="company" required autoComplete="organization" />
            <div className="two">
              <Field label="Contact person" name="contact_name" required autoComplete="name" />
              <Field label="Business email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="two">
              <Field label="Phone number" name="phone" type="tel" required autoComplete="tel" />
              <Field label="Company website" name="website" type="url" optional autoComplete="url" />
            </div>
            <Select label="What type of talent are you looking for?" name="talent_type" options={talentCategories} required />
            <Field label="Tell us more about your requirements" name="requirements" type="textarea" optional rows={4} placeholder="Job role, skills, location, expected start date..." />
            <Consent>I agree that RemoteCore may contact me about this request, as described in the <a href="/privacy">Privacy Policy</a>.</Consent>
          </Form>
        </div>
      </div>
    </section>
  );
}
