/* eslint-disable @next/next/no-img-element */
import { Close, Icon } from "@/components/site/Blocks";
import { HomeMotion } from "@/components/site/HomeMotion";

const services = [
  ["health", "Healthcare Administrative Support", "Helping healthcare teams focus on patient care."],
  ["support", "Customer Experience & Support", "Every interaction matters."],
  ["assist", "Virtual & Executive Assistance", "Less administrative work. More room to grow."],
  ["sales", "Sales & Business Support", "Keep your business moving."],
];
const why = [
  ["match", "Tailored Talent Matching"],
  ["insight", "Healthcare Industry Insight"],
  ["person", "Personalized Service"],
  ["growth", "Career Development"],
];
const profiles = [
  { img: "/assets/p3.webp", name: "Amara O.", role: "Patient Intake Coordinator", text: "Scheduling, intake and insurance checks for outpatient clinics.", meta: "6 years · Full time · GMT+1" },
  { img: "/assets/p1.webp", name: "Marco D.", role: "Customer Support Specialist", text: "Phone, email and chat support, ticket management and follow ups.", meta: "4 years · Full time · GMT+8" },
  { img: "/assets/p2.webp", name: "Lucía R.", role: "Executive Assistant", text: "Inbox and calendar management, travel and document preparation.", meta: "9 years · Part time · GMT-5" },
];

export default function Home() {
  return (
    <>
      <section className="hero" id="hero">
        <div className="wrap hero__in">
          <div>
            <p className="brand">RemoteCore Outsourcing LLC</p>
            <p className="tagline">Global Talent.<br />Local Impact.</p>
            <h1>Build Your Dream Remote Team.</h1>
            <p className="hero__sub">Connect with skilled, carefully screened remote professionals for healthcare administration, customer support, virtual assistance, and more.</p>
            <div className="btns">
              <a className="btn btn--main" href="/hire-talent">Hire Remote Talent</a>
              <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
            </div>
            <p className="hero__trust">Flexible staffing • Personalized recruitment • International talent</p>
          </div>

          <div className="scene" id="scene" aria-hidden="true">
            <div className="plane scene__glow" />
            <div className="plane scene__orbit" />
            <div className="plane pc pc--a"><img src="/assets/p1.webp" width={720} height={900} alt="" /><div><b>Marco D.</b><span>Customer Support</span></div></div>
            <div className="plane pc pc--b"><img src="/assets/p2.webp" width={720} height={900} alt="" /><div><b>Lucía R.</b><span>Executive Assistant</span></div></div>
            <div className="plane pc pc--c"><img src="/assets/p3.webp" width={720} height={900} alt="" /><div><b>Amara O.</b><span>Patient Intake Coordinator</span></div></div>
            <div className="plane chip chip--a"><span className="wave" data-wave="14" />Voice introduction</div>
            <div className="plane chip chip--b">Customer support <small>· US hours</small></div>
            <div className="plane chip chip--c"><i className="dot" />Shortlisted</div>
            <span className="sample">Sample profiles</span>
          </div>
        </div>
      </section>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in>
            <h2>Built for Businesses. Designed Around People.</h2>
            <p className="lede">Great businesses are built by great people. We connect ambitious organizations with capable remote professionals who bring practical skills, fresh perspectives, and dependable support.</p>
          </div>
          <div className="cards" data-sc-in data-sc-stagger="70">
            {services.map(([icon, title, text]) => (
              <a key={title} className="card" href="/services" style={{ textDecoration: "none" }}>
                <Icon name={icon} />
                <h3>{title}</h3>
                <p>{text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split">
          <div data-sc-in>
            <h2>More Than Recruitment. A Partner in Your Growth.</h2>
            <p className="lede">We take time to understand your business, identify the skills that matter, and introduce professionals whose experience aligns with your goals.</p>
            <div className="cards" style={{ marginTop: 28, gridTemplateColumns: "1fr 1fr" }}>
              {why.map(([icon, label]) => (
                <div key={label} className="card" style={{ padding: 18 }}>
                  <Icon name={icon} />
                  <h3 style={{ fontSize: 17 }}>{label}</h3>
                </div>
              ))}
            </div>
          </div>
          <figure className="photo" data-sc-reveal="up" data-sc-reveal-at="0.05 0.45">
            <img src="/assets/work.webp" width={1400} height={933} alt="Two people talking across a desk with a laptop and a notebook" />
          </figure>
        </div>
      </section>

      <section className="req" id="request" data-sc-act="pin" data-sc-span="3.4">
        <div data-sc-stage>
          <div className="caps">
            <div className="cap is-on">
              <small>How hiring works</small>
              <h2 className="big">1. Tell us what you need.</h2>
              <p>Share the role, the skills, the working hours and when you want someone to start.</p>
            </div>
            <div className="cap">
              <small>How hiring works</small>
              <p className="big">2. We source and screen.</p>
              <p>We look for people with the right experience and check how they communicate.</p>
            </div>
            <div className="cap">
              <small>How hiring works</small>
              <p className="big">3. Meet your shortlist.</p>
              <p>Read short summaries, hear each person, and interview the ones you like.</p>
            </div>
            <div className="cap">
              <small>How hiring works</small>
              <p className="big">4. Select and onboard.</p>
              <p>Choose your new team member, confirm the terms, and welcome them aboard.</p>
              <a className="btn btn--main" href="/hire-talent">See How Hiring Works</a>
            </div>
          </div>

          <div className="rq" id="rq" aria-label="Sample staffing request">
            <div className="rq__head">
              <span className="ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V5l8-2v18M12 7h8v14M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2" /></svg></span>
              <div><h3>Staffing request</h3><p>Outpatient clinic, Texas</p></div>
              <span className="rq__state" id="rqState" aria-live="polite">Request received</span>
            </div>
            <div className="rq__fields">
              <div><span>Role</span><b>Patient Intake Coordinator</b></div>
              <div><span>Number of hires</span><b>2</b></div>
              <div><span>Schedule</span><b>8am to 5pm US Central</b></div>
              <div><span>Experience</span><b>2+ years</b></div>
              <div><span>Skills</span><b>EHR, insurance verification</b></div>
              <div><span>Start date</span><b>January 5</b></div>
            </div>
            <div className="screen">
              <div><i />Experience</div>
              <div><i />Communication</div>
              <div><i />Job requirements</div>
              <div><i />Availability</div>
            </div>
            <div className="short">
              <div className="cand"><img src="/assets/p1.webp" width={720} height={900} alt="" /><div><b>Marco D.</b>4 years<span className="wave" data-wave="18" /></div></div>
              <div className="cand" data-pick="1"><img src="/assets/p3.webp" width={720} height={900} alt="" /><span className="stamp">Selected</span><div><b>Amara O.</b>6 years<span className="wave" data-wave="18" /></div></div>
              <div className="cand"><img src="/assets/p2.webp" width={720} height={900} alt="" /><div><b>Lucía R.</b>5 years<span className="wave" data-wave="18" /></div></div>
            </div>
            <p className="sample">Sample request and sample profiles</p>
          </div>
        </div>
      </section>

      <section className="talent" data-sc-act="pan" data-sc-span="2.4">
        <div data-sc-stage>
          <div className="rail" data-sc-pan="0.04">
            <div className="rail__lead">
              <h2>Meet the Talent Behind Great Teams.</h2>
              <p className="soft">Explore professionals with the skills to support your business, or tell us what you need and let us recruit for you.</p>
              <div className="btns">
                <a className="btn btn--main" href="/talent-marketplace">Browse Talent</a>
                <a className="btn btn--ghost" href="/hire-talent#request">Request Talent</a>
              </div>
            </div>
            {profiles.map((p) => (
              <article key={p.name} className="prof">
                <img src={p.img} width={720} height={900} alt="" />
                <div>
                  <span className="tag tag--plum">Sample profile</span>
                  <h3>{p.role}</h3>
                  <p>{p.text}</p>
                  <span className="meta">{p.name} · {p.meta}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Close title="Ready to Build a Stronger Team?" text="Tell us about your staffing needs and let’s explore the right solution together.">
        <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
      </Close>
      <HomeMotion />
    </>
  );
}
