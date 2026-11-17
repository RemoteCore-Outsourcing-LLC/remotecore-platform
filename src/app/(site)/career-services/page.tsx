import type { Metadata } from "next";
import { Icon, PageHero, Steps } from "@/components/site/Blocks";
import { Consent, Field, Form, Select } from "@/components/site/Form";

export const metadata: Metadata = { title: "Career Services", description: "Interview preparation, mock interviews, resume support, LinkedIn profile development, and career readiness coaching." };

const services = [
  ["chat", "Interview Preparation", "Learn to structure compelling, natural answers."],
  ["person", "Personalized Mock Interviews", "Practice realistic interview scenarios and receive actionable feedback."],
  ["doc", "Resume Support", "Present experience and achievements clearly."],
  ["star", "LinkedIn Profile Development", "Strengthen your professional presence."],
  ["growth", "Career Readiness Coaching", "Identify strengths and areas for improvement."],
];

export default function CareerServices() {
  return (
    <>
      <PageHero eyebrow="Career Services" title="Your Experience Deserves to Be Heard." lede="You may already have the skills employers need. We help you communicate your value clearly and confidently.">
        <a className="btn btn--main" href="#services">Explore Career Services</a>
      </PageHero>

      <section className="sec" id="services">
        <div className="wrap cards" data-sc-in data-sc-stagger="70">
          {services.map(([icon, t, d]) => (
            <article key={t} className="card"><Icon name={icon} /><h3>{t}</h3><p>{d}</p></article>
          ))}
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="head" data-sc-in><h2>How booking works</h2></div>
          <Steps items={[
            { title: "Choose a service", text: "Pick the help you need." },
            { title: "Review the details", text: "See what is included, how long it takes, and the price once it is confirmed." },
            { title: "Select a time", text: "Choose an available appointment." },
            { title: "Pay if applicable", text: "Some services are paid. You always see the price before you book." },
            { title: "Get your confirmation", text: "You receive a confirmation and instructions to prepare." },
          ]} />
        </div>
      </section>

      <section className="close" id="book">
        <div className="wrap" style={{ alignItems: "start" }}>
          <div>
            <h2>Prepare for Your Next Opportunity.</h2>
            <p>Tell us which service you are interested in and we will contact you with available times.</p>
            <p style={{ fontSize: 15 }}>Career coaching and training do not guarantee employment or placement. These services are optional.</p>
          </div>
          <div className="panel" style={{ minWidth: "min(440px, 100%)" }}>
            <h3>Book a Session</h3>
            <Form kind="career-session" submitLabel="Book a Session" thanksText="Thanks. We received your request and will email you with available times.">
              <Field label="Full name" name="full_name" required autoComplete="name" />
              <Field label="Email" name="email" type="email" required autoComplete="email" />
              <Select label="Service" name="service" options={services.map((s) => s[1])} required />
              <Field label="Anything we should know?" name="message" type="textarea" optional rows={3} />
              <Consent>I agree that RemoteCore may contact me about this request, as described in the <a href="/privacy">Privacy Policy</a>.</Consent>
            </Form>
          </div>
        </div>
      </section>
    </>
  );
}
