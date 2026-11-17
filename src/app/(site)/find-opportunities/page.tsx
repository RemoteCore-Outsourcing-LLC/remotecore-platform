import type { Metadata } from "next";
import { Close, PageHero, Steps } from "@/components/site/Blocks";
import { Consent, Field, Form, Select } from "@/components/site/Form";
import { talentCategories } from "@/lib/site";

export const metadata: Metadata = { title: "Find Opportunities", description: "Join the RemoteCore talent network and explore remote roles that match your skills and experience." };

export default function FindOpportunities() {
  return (
    <>
      <PageHero eyebrow="Find Opportunities" title="Your Skills Deserve Opportunity." lede="Join the RemoteCore talent network to explore remote roles and connect with opportunities aligned with your skills and experience.">
        <a className="btn btn--main" href="#join">Join Our Talent Network</a>
      </PageHero>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in><h2>How it works</h2></div>
          <Steps items={[
            { title: "Create Your Account", text: "Enter your name, email, password, and country of residence. Confirm your email address." },
            { title: "Complete Your Profile", text: "Add your professional summary, employment experience, skills, tools, languages, preferred roles, availability, and time zone. Upload your resume." },
            { title: "Explore and Apply", text: "Browse available positions and submit applications for roles that match your background." },
            { title: "Screening and Interviews", text: "Candidates may be contacted for role specific screening, assessments, and interviews. Selection is based on client needs and qualifications." },
          ]} />
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>Join our talent network</h2>
            <p className="lede">Tell us about yourself and the kind of remote work you want.</p>
            <div className="notice" style={{ marginTop: 28 }}>
              <b>Important notice.</b> Joining the talent network does not guarantee placement or employment. Learning Hub courses and paid Career Services are optional and are not required to apply for jobs.
            </div>
            <p className="soft" style={{ marginTop: 18, fontSize: 15 }}>You choose whether your profile appears in our Talent Marketplace. Businesses never see your phone, email or resume without your permission.</p>
          </div>
          <div className="panel" id="join">
            <h2>Candidate registration</h2>
            
            <Form kind="candidate" submitLabel="Join Our Talent Network" thanksText="Welcome to the RemoteCore talent network. We will email you about suitable opportunities.">
              <div className="two">
                <Field label="Full name" name="full_name" required autoComplete="name" />
                <Field label="Email" name="email" type="email" required autoComplete="email" />
              </div>
              <div className="two">
                <Field label="Phone, with country code" name="phone" type="tel" optional autoComplete="tel" placeholder="+63 ..." />
                <Field label="Country" name="country" required autoComplete="country-name" />
              </div>
              <div className="two">
                <Field label="Time zone" name="time_zone" optional />
                <Select label="Target job category" name="category" options={talentCategories.filter((c) => c !== "Custom Role").concat("Other")} required />
              </div>
              <div className="two">
                <Field label="Years of experience" name="years" type="number" optional />
                <Field label="Preferred work hours" name="hours" optional />
              </div>
              <Field label="Skills and software" name="skills" optional />
              <Field label="LinkedIn" name="linkedin" type="url" optional />
              <Consent>I agree to receive recruitment related messages from RemoteCore and accept the <a href="/privacy">Privacy Policy</a>.</Consent>
            </Form>
          </div>
        </div>
      </section>

      <Close title="Take the Next Step in Your Remote Career.">
        <a className="btn btn--main" href="/register/job-seeker">Create Your Profile</a>
      </Close>
    </>
  );
}
