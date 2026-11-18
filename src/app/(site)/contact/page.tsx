import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { Consent, Field, Form, Select } from "@/components/site/Form";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Contact Us", description: "Contact RemoteCore Outsourcing about hiring remote talent, career opportunities, training, or anything else." };

const types = ["I Want to Hire Talent", "I Am Looking for Work", "I Have a Learning Hub Question", "I Need Career Services Support", "General Inquiry"];

export default async function Contact() {
  const { company } = await getSettings();
  return (
    <>
      <PageHero page="contact" />
      <section className="sec sec--pale">
        <div className="wrap split split--top">
          <div className="panel">
            <h2>Send us a message</h2>
            <Form kind="contact" submitLabel="Send Message" thanksText="Thanks for reaching out. We have received your message and will respond as soon as possible.">
              <div className="two">
                <Field label="Full name" name="full_name" required autoComplete="name" />
                <Field label="Email address" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="two">
                <Select label="Inquiry type" name="inquiry_type" options={types} required />
                <Field label="Company name" name="company" optional autoComplete="organization" />
              </div>
              <Field label="Message" name="message" type="textarea" required rows={5} />
              <Consent>I agree that RemoteCore may use these details to answer my message, as described in the <a href="/privacy">Privacy Policy</a>.</Consent>
            </Form>
          </div>
          <div style={{ display: "grid", gap: 18 }}>
            <div className="card card--dark">
              <h3>Hiring for your business?</h3>
              <p>Book a consultation and tell us about the roles you need to fill.</p>
              <a className="btn btn--main" href="/book-consultation" style={{ alignSelf: "start", marginTop: 8 }}>Book a Consultation</a>
            </div>
            <div className="card">
              <h3>Our office</h3>
              <p>{company.address.map((l) => <span key={l}>{l}<br /></span>)}</p>
              {company.email && <p><a href={`mailto:${company.email}`}>{company.email}</a></p>}
              {company.phone && <p><a href={`tel:${company.phone.replace(/[^+\d]/g, "")}`}>{company.phone}</a></p>}
            </div>
            <div className="card">
              <h3>Common questions</h3>
              <ul>
                <li>What roles can RemoteCore help fill?</li>
                <li>How does hiring work?</li>
                <li>Who pays the selected professional?</li>
                <li>Can I register as a candidate?</li>
                <li>Are courses required to apply?</li>
              </ul>
              <a className="btn btn--ghost btn--sm" href="/faq" style={{ alignSelf: "start", marginTop: 8 }}>View FAQs</a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
