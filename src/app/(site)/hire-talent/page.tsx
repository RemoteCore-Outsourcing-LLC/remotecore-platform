import type { Metadata } from "next";
import { Close, PageHero, Pricing, Steps } from "@/components/site/Blocks";
import { Consent, Field, Form, Select } from "@/components/site/Form";
import { talentCategories } from "@/lib/site";

export const metadata: Metadata = { title: "Hire Talent", description: "Tell us the role you need. RemoteCore sources and screens remote professionals and introduces your shortlist." };

export default function HireTalent() {
  return (
    <>
      <PageHero page="hire-talent">
        <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
        <a className="btn btn--line" href="/talent-marketplace">Browse Talent Marketplace</a>
      </PageHero>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in><h2>How Hiring Works</h2></div>
          <Steps items={[
            { title: "Tell Us Your Needs", text: "Share the job title, responsibilities, required skills, preferred working hours, experience level, and anticipated start date." },
            { title: "We Source and Screen", text: "Our team searches for potential candidates and evaluates relevant experience, communication, and job specific requirements." },
            { title: "Meet Your Shortlist", text: "Review candidate summaries, interview suitable applicants, and assess who best fits your team." },
            { title: "Hire and Onboard", text: "Select your preferred candidate, confirm engagement terms, and onboard the new team member through your business process." },
          ]} />
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split split--top">
          <div className="sticky-col" data-sc-in>
            <h2>A Clear, Straightforward Hiring Model.</h2>
            <p className="lede">Your business hires and pays its selected professional directly, starting at $5/hr, with no ongoing markup. RemoteCore charges a one-time flat placement fee, due only when you hire, with $0 upfront deposit. Every placement comes with our 60-day free replacement guarantee. Your custom quote is provided during your free consultation.</p>
            <div className="btns" style={{ marginTop: 28 }}>
              <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
              <a className="btn btn--ghost" href="/talent-marketplace">Browse Talent Marketplace</a>
            </div>
          </div>
          <div id="request">
            <p className="secondary-cta">Already know exactly what you need? Send us a staffing request.</p>
            <div className="panel">
            <h2>Staffing Request</h2>
            <p>Tell us who you need. Our team reviews every request and follows up by email.</p>
            <Form kind="staffing-request" submitLabel="Submit Staffing Request" thanksText="Thank you for contacting RemoteCore. Our team will review your request and follow up.">
              <div className="two">
                <Field label="Full name" name="full_name" required autoComplete="name" />
                <Field label="Company name" name="company" required autoComplete="organization" />
              </div>
              <div className="two">
                <Field label="Work email" name="email" type="email" required autoComplete="email" />
                <Field label="Phone" name="phone" type="tel" optional autoComplete="tel" />
              </div>
              <div className="two">
                <Field label="Industry" name="industry" required />
                <Select label="Role(s) needed" name="roles" options={talentCategories} required />
              </div>
              <div className="two">
                <Field label="Number of hires" name="hires" type="number" required />
                <Field label="Target start date" name="start_date" type="date" optional />
              </div>
              <Field label="Responsibilities" name="responsibilities" type="textarea" required rows={3} />
              <Field label="Required skills" name="skills" optional />
              <div className="two">
                <Field label="Preferred schedule and time zone" name="schedule" optional />
                <Field label="Expected compensation range" name="compensation" optional />
              </div>
              <Field label="Additional details" name="details" type="textarea" optional rows={3} />
              <Consent>I agree that RemoteCore may use these details to respond to my request, as described in the <a href="/privacy">Privacy Policy</a>. I understand that hiring through RemoteCore includes an agreed placement fee, with final terms provided before engagement.</Consent>
            </Form>
            </div>
          </div>
        </div>
      </section>

      <Pricing />

      <Close trust title="Prefer to Discuss Your Hiring Needs First?" text="Book a short consultation and talk through the role with our team before you send a request.">
        <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
      </Close>
    </>
  );
}
