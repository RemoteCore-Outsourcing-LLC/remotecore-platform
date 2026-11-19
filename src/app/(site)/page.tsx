/* eslint-disable @next/next/no-img-element */
import { Close, Icon } from "@/components/site/Blocks";
import { HomeMotion } from "@/components/site/HomeMotion";
import { Proof } from "@/components/site/Proof";

// The nine approved service cards (RCO Homepage Corrections, 2026-11-17).
const services = [
  ["support", "Customer Support", "Customer service representatives, live chat, email and phone support specialists."],
  ["assist", "Virtual Administrative", "Virtual assistants, executive assistants, scheduling and administrative professionals."],
  ["sales", "Sales & Marketing", "Sales representatives, lead generation specialists and digital marketing professionals."],
  ["home", "Real Estate & Hospitality", "Property management assistants, reservation agents and guest support specialists."],
  ["tech", "Technology & IT", "IT support specialists, software developers and technical support professionals."],
  ["health", "Healthcare Administration", "Medical virtual assistants, patient coordinators and healthcare support staff."],
  ["money", "Finance & Accounting", "Bookkeepers, billing specialists and accounting support professionals."],
  ["clipboard", "Project Managers & Estimators", "Project coordinators, project managers and cost estimation professionals."],
  ["plus", "Custom Roles", "Need something different? We’ll recruit talent based on your specific requirements."],
];
const why = [
  ["match", "Tailored Talent Matching", "We match each role to the skills, experience and working hours your business needs."],
  ["globe", "Global Talent Access", "Skilled professionals from the Caribbean, Latin America and the Philippines."],
  ["person", "Personalized Service", "A recruitment team that takes the time to learn how your business works."],
  ["receipt", "Transparent, Flat-Fee Pricing", "Hire pre-vetted remote professionals starting at $5/hr with a simple one-time flat placement fee, $0 upfront deposit, and no ongoing monthly markups."],
  ["star", "60-Day Free Replacement Guarantee", "Hire with complete peace of mind. If a placed candidate isn't the right fit within their first 60 days, we'll source and place a replacement at no additional cost."],
];
const profiles = [
  { img: "/assets/p1.webp", name: "Marco D.", role: "Customer Support Specialist", skills: ["Zendesk", "Live chat", "Email support"], exp: "4 years", avail: "Full time · US hours" },
  { img: "/assets/p2.webp", name: "Lucía R.", role: "Executive Assistant", skills: ["Calendar management", "Travel", "Google Workspace"], exp: "9 years", avail: "Part time · GMT-5" },
  { img: "/assets/p3.webp", name: "Amara O.", role: "Patient Intake Coordinator", skills: ["Scheduling", "Insurance checks", "EHR"], exp: "6 years", avail: "Full time · GMT+1" },
];

export default async function Home() {
  return (
    <>
      <section className="hero" id="hero">
        <div className="wrap hero__in">
          <div>
            <p className="brand">RemoteCore Outsourcing LLC</p>
            <p className="tagline">Global Talent.<br />Local Impact.</p>
            <h1>Build Your Dream Remote Team.</h1>
            <p className="hero__sub">Connect with skilled, carefully screened remote professionals from the Caribbean, Latin America, and the Philippines. We help businesses find the right talent across multiple industries—without the complexity of traditional hiring.</p>
            <div className="btns">
              <a className="btn btn--main" href="/hire-talent">Hire Remote Talent</a>
              <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
            </div>
            <p className="hero__trust">Vetted talent starting at <b>$5/hr</b><i aria-hidden="true"> • </i><b>$0 upfront deposit</b><i aria-hidden="true"> • </i><b>60-day replacement guarantee</b></p>
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
            <p className="lede">Great businesses are built by great people. At RemoteCore Outsourcing, we connect companies with skilled remote professionals across multiple industries, helping them build dependable teams, simplify recruitment, and grow with confidence.</p>
          </div>
          <div className="svc9" data-sc-in data-sc-stagger="50">
            {services.map(([icon, title, text]) => (
              <a key={title} className="svc9__card" href={title === "Custom Roles" ? "/hire-talent#request" : "/services"}>
                <Icon name={icon} />
                <span><b>{title}</b><span>{text}</span></span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap split">
          <div data-sc-in>
            <h2>More Than Recruitment. A Partner in Your Growth.</h2>
            <p className="lede">We take the time to understand your business, identify the skills that matter most, and connect you with qualified remote professionals who align with your goals, company culture, and operational needs. Our personalized recruitment approach helps you build a dependable team with confidence.</p>
            <div className="why4">
              {why.map(([icon, label, text]) => (
                <div key={label} className="why4__card">
                  <Icon name={icon} />
                  <h3>{label}</h3>
                  <p>{text}</p>
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
          <div className="req__left">
          <h2 className="kicker">How Hiring Works</h2>
          <div className="caps">
            <div className="cap is-on">
              <h3 className="big">1. Tell Us What You Need.</h3>
              <p>Share the role, the skills, the working hours and when you want someone to start.</p>
            </div>
            <div className="cap">
              <h3 className="big">2. We Source and Screen.</h3>
              <p>We look for people with the right experience and check how they communicate.</p>
            </div>
            <div className="cap">
              <h3 className="big">3. Meet Your Shortlist.</h3>
              <p>Read short summaries, hear each person, and interview the ones you like.</p>
            </div>
            <div className="cap">
              <h3 className="big">4. Select and Onboard.</h3>
              <p>Choose your preferred candidate, pay your one-time flat placement fee only upon hire, and welcome your new team member. With our direct-hire model, you pay your professional directly (starting at $5/hr) with zero ongoing markups—backed by our 60-day replacement guarantee.</p>
              <a className="btn btn--main" href="/hire-talent">See How Hiring Works</a>
            </div>
          </div>
          </div>

          <div className="rq" id="rq" aria-hidden="true">
            <div className="rq__head">
              <span className="ico" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V5l8-2v18M12 7h8v14M7 8h2M7 12h2M7 16h2M15 11h2M15 15h2" /></svg></span>
              <div><h3>Staffing Request</h3><p>Online store, United States</p></div>
              <span className="rq__state" id="rqState" aria-live="polite">Request received</span>
            </div>
            <div className="rq__fields">
              <div><span>Role</span><b>Customer Support Specialist</b></div>
              <div><span>Number of hires</span><b>2</b></div>
              <div><span>Schedule</span><b>9am to 6pm US Eastern</b></div>
              <div><span>Experience</span><b>2+ years</b></div>
              <div><span>Skills</span><b>Live chat, email, order support</b></div>
              <div><span>Start date</span><b>Within 2 weeks</b></div>
            </div>
            <div className="screen">
              <div><i />Experience</div>
              <div><i />Communication</div>
              <div><i />Job requirements</div>
              <div><i />Availability</div>
            </div>
            <div className="short">
              <div className="cand"><img src="/assets/p3.webp" width={720} height={900} alt="" /><div><b>Amara O.</b>6 years<span className="wave" data-wave="18" /></div></div>
              <div className="cand" data-pick="1"><img src="/assets/p1.webp" width={720} height={900} alt="" /><span className="stamp">Selected</span><div><b>Marco D.</b>4 years<span className="wave" data-wave="18" /></div></div>
              <div className="cand"><img src="/assets/p2.webp" width={720} height={900} alt="" /><div><b>Lucía R.</b>9 years<span className="wave" data-wave="18" /></div></div>
            </div>
            <p className="sample">Example request with sample profiles</p>
          </div>
        </div>
      </section>

      <section className="talent" data-sc-act="pan" data-sc-span="2.4">
        <div data-sc-stage>
          <div className="rail" data-sc-pan="0.04">
            <div className="rail__lead">
              <h2>Meet the Talent Behind Great Teams.</h2>
              <p className="soft">Explore skilled remote professionals across a wide range of industries. Browse available talent, discover their experience and expertise, or let our recruitment team find the right match for your business.</p>
              <div className="btns">
                <a className="btn btn--main" href="/talent-marketplace">Browse Talent</a>
                <a className="btn btn--ghost" href="/hire-talent#request">Request Talent</a>
              </div>
            </div>
            {profiles.map((p) => (
              <article key={p.name} className="prof">
                <img src={p.img} width={720} height={900} alt="" />
                <div>
                  <span className="tag tag--plum">Sample profile, not available for hire</span>
                  <h3>{p.role}</h3>
                  <ul className="prof__skills" aria-label="Skills">{p.skills.map((k) => <li key={k}>{k}</li>)}</ul>
                  <dl className="prof__facts"><dt>Experience</dt><dd>{p.exp}</dd><dt>Availability</dt><dd>{p.avail}</dd></dl>
                  <span className="meta">{p.name}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <Proof />
      <Close compact title="Ready to Build a Stronger Team?" text="Start your search with $0 upfront deposit and talent starting at $5/hr. Book a free consultation to receive your custom flat-fee placement quote.">
        <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
        <a className="btn btn--line" href="/hire-talent#request">Request Talent</a>
      </Close>
      <HomeMotion />
    </>
  );
}
