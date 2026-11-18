import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function Register() {
  return (
    <section className="phero">
      <div className="wrap">
        <p className="eyebrow">Create an account</p>
        <h1>Who are you joining as?</h1>
        <div className="cards" style={{ marginTop: 32, maxWidth: 820 }}>
          <a className="card" href="/register/job-seeker" style={{ textDecoration: "none" }}>
            <h3>I am looking for work</h3>
            <p>Join the talent network, build your profile and apply for remote roles.</p>
            <span className="btn btn--main btn--sm" style={{ alignSelf: "start", marginTop: 8 }}>Create a job seeker account</span>
          </a>
          <a className="card" href="/register/employer" style={{ textDecoration: "none" }}>
            <h3>I want to hire talent</h3>
            <p>Create a company account, post roles and send staffing requests.</p>
            <span className="btn btn--main btn--sm" style={{ alignSelf: "start", marginTop: 8 }}>Create a company account</span>
          </a>
        </div>
      </div>
    </section>
  );
}
