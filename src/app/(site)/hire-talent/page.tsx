import type { Metadata } from "next";
import { Close, PageHero, Steps } from "@/components/site/Blocks";
import { Consent, Field, Form, Select } from "@/components/site/Form";
import { talentCategories } from "@/lib/site";

export const metadata: Metadata = { title: "Hire Talent", description: "Tell us the role you need. RemoteCore sources and screens remote professionals and introduces your shortlist." };

export default function HireTalent() {
  return (
    <>
      <PageHero eyebrow="Hire Talent" title="Your Next Great Hire Starts Here." lede="Finding the right remote professional should not feel overwhelming. We simplify recruitment so you can focus on running your business.">
        <a className="btn btn--main" href="#request">Request Talent</a>
        <a className="btn btn--line" href="/talent-marketplace">Browse Talent Marketplace</a>
      </PageHero>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in><h2>How hiring works</h2></div>
          <Steps items={[
            { title: "Tell Us Your Needs", text: "Share the job title, responsibilities, required skills, preferred working hours, experience level, and anticipated start date.", action: <a className="btn btn--main btn--sm" href="#request">Submit Staffing Request</a> },
            { title: "We Source and Screen", text: "Our team searches for potential candidates and evaluates relevant experience, communication, and job specific requirements." },
            { title: "Meet Your Shortlist", text: "Review candidate summaries, interview suitable applicants, and assess who best fits your team." },
            { title: "Hire and Onboard", text: "Select your preferred candidate, confirm engagement terms, and onboard the new team member through your business process." },
          ]} />
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>A Clear, Straightforward Hiring Model.</h2>
            <p className="lede">Your business hires and pays its selected professional directly. RemoteCore charges an agreed recruitment placement fee for its recruitment services. Final terms are provided before engagement.</p>
            <div className="btns" style={{ marginTop: 28 }}>
              <a className="btn btn--ghost" href="/talent-marketplace">Browse Talent Marketplace</a>
              <a className="btn btn--ghost" href="#request">Request Custom Recruitment</a>
            </div>
          </div>
          <div className="panel" id="request">
            <h2>Request Talent</h2>
            <p>Tell us who you need. Our team reviews every request.</p>
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
      </section>

      <Close title="Tell Us Who You Need.">
        <a className="btn btn--main" href="#request">Request Talent</a>
        <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
      </Close>
    </>
  );
}
