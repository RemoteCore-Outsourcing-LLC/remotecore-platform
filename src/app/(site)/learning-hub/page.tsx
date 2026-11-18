import type { Metadata } from "next";
import { Icon, PageHero, Steps } from "@/components/site/Blocks";
import { Field, Form } from "@/components/site/Form";

export const metadata: Metadata = { title: "Learning Hub", description: "Practical, career focused training for remote professionals. Coming soon." };

const courses = [
  ["health", "Healthcare Administration & Medical Virtual Assistance", "Patient coordination, scheduling, terminology, documentation, and administrative workflows."],
  ["laptop", "Healthcare Software Familiarization", "Approved demonstrations and simulated environments using fictional patient information."],
  ["assist", "Virtual Assistance & Business Administration", "Digital tools, calendar management, professional communication, and administrative support."],
  ["chat", "Customer Service & Communication", "Service quality, problem solving, and issue resolution."],
  ["person", "Remote Work Readiness", "Collaboration, organization, professionalism, and productivity."],
];

export default function LearningHub() {
  return (
    <>
      <PageHero page="learning-hub" badge="Coming Soon">
        <a className="btn btn--main" href="#courses">Explore Courses</a>
      </PageHero>

      <section className="sec" id="courses">
        <div className="wrap">
          <div className="head" data-sc-in>
            <h2>Learn Beyond the Classroom.</h2>
            <p className="lede">Our planned courses combine structured lessons, practical exercises, realistic scenarios, and knowledge assessments.</p>
          </div>
          <div className="cards" data-sc-in data-sc-stagger="70">
            {courses.map(([icon, t, d]) => (
              <article key={t} className="card"><Icon name={icon} /><span className="tag tag--plum" style={{ alignSelf: "start" }}>Coming Soon</span><h3>{t}</h3><p>{d}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="head" data-sc-in><h2>Your learning journey</h2></div>
          <Steps items={[
            { title: "Explore courses", text: "Find the course that fits the role you want." },
            { title: "Enroll in a course", text: "Sign up and start when you are ready." },
            { title: "Complete lessons and exercises", text: "Learn with practical tasks and realistic scenarios." },
            { title: "Pass applicable assessments", text: "Check what you learned with short knowledge tests." },
            { title: "Download your certificate", text: "Get a RemoteCore Certificate of Completion where eligible." },
          ]} />
          <div className="notice" style={{ marginTop: 28 }}>
            <b>About certificates.</b> A RemoteCore Certificate of Completion is not an official certification from a software vendor or government authority. Courses use approved software demonstrations and fictional patient data only.
          </div>
        </div>
      </section>

      <section className="close">
        <div className="wrap">
          <div>
            <h2>Your Growth Starts Here.</h2>
            <p>Leave your email and we will tell you when the first courses open.</p>
          </div>
          <div className="panel" style={{ minWidth: "min(420px, 100%)" }}>
            <Form kind="learning-notify" submitLabel="Notify Me at Launch" thanksTitle="You are on the list." thanksText="We will email you when the first courses open.">
              <Field label="Email" name="email" type="email" required autoComplete="email" />
            </Form>
          </div>
        </div>
      </section>
    </>
  );
}
