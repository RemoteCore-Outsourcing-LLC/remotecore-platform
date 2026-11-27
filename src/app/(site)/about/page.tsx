import type { Metadata } from "next";
import { Close, Icon, PageHero, REGIONS_TEXT } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "About Us", description: "RemoteCore Outsourcing connects businesses with capable remote professionals and creates pathways for professional growth." };

const values = [
  ["Integrity", "Honest, transparent communication."],
  ["Quality", "Thoughtful screening and role matching."],
  ["Opportunity", "Creating access to meaningful work."],
  ["Partnership", "Relationships built on trust."],
  ["Growth", "Continuous learning and improvement."],
];

export default function About() {
  return (
    <>
      <PageHero page="about" aside={<div className="phero__stat"><b>4 Global Regions</b><span>Caribbean · Latin America · Philippines · Africa</span><b>US-Aligned Hours</b><span>Managed from Fall River, Massachusetts</span></div>} />

      <section className="sec">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>Our Story</h2>
            <p className="lede">Our approach is built on firsthand experience in healthcare administration, customer support, and remote business operations.</p>
            <p className="lede">We know how much clear communication and dependable team members matter to your daily workflow, so we connect businesses with skilled professionals while supporting practical career growth.</p>
          </div>
          <div className="cards cards--even" data-sc-in data-sc-stagger="80">
            <div className="card card--dark"><Icon name="star" /><h3>Mission</h3><p>To connect businesses with capable remote professionals while creating pathways for professional growth, meaningful opportunities, and lasting partnerships.</p></div>
            <div className="card"><Icon name="growth" /><h3>Vision</h3><p>To build a globally recognized staffing and professional development company known for quality, integrity, innovation, and opportunity.</p></div>
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="head" data-sc-in><h2>Our Values</h2></div>
          <div className="ledger" data-sc-in>
            {values.map(([k, v]) => <div key={k}><h3>{k}</h3><p>{v}</p></div>)}
          </div>
        </div>
      </section>

      <section className="sec sec--lead">
        <div className="wrap split split--top">
          <div data-sc-in>
            <p className="eyebrow" style={{ color: "var(--teal)" }}>About our leadership</p>
            <h2>Leadership Grounded in Real-World Operations.</h2>
            <figure className="founder">
              <img src="/assets/founder.webp" width={720} height={900} loading="lazy" decoding="async" alt="Kemar Cole, founder of RemoteCore Outsourcing" />
              <figcaption><b>Kemar Cole</b><span>Founder, RemoteCore Outsourcing</span></figcaption>
            </figure>
          </div>
          <div className="story" data-sc-in>
            <p className="lede" style={{ marginTop: 0 }}>Before starting RemoteCore, I worked in healthcare administration and customer support, and I’ve managed remote teams and day-to-day business operations. Every day I saw two problems that didn’t need to exist.</p>
            <p className="lede">Small businesses were stretched thin. Owners were answering phones, chasing schedules and catching up on paperwork at night because they couldn’t find reliable help they could afford.</p>
            <p className="lede">At the same time, there are skilled, hardworking people across the Caribbean, Latin America and the Philippines who can do that work well, but rarely get a fair chance at it.</p>
            <p className="lede">I started RemoteCore Outsourcing in Fall River, Massachusetts, to connect the two. Because I’ve done this work myself, I know what a good scheduler, coordinator or support specialist looks like, and I know what it takes for a remote hire to succeed.</p>
            <p className="lede">Every candidate we place is someone I’d trust in my own office. I personally review each shortlist before it reaches a client, and I stay involved after the hire, because a placement only counts as a success when it works for both sides.</p>
            <p className="lede" style={{ color: "var(--sc-ink)", fontWeight: 600 }}>If you’re spending your evenings on work someone else could do, let’s talk.</p>
            <div className="btns" style={{ marginTop: 22 }}><a className="btn btn--main" href="/book-consultation">Book a Consultation</a></div>
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="card card--dark bridge" data-sc-in>
            <Icon name="globe" />
            <h2>A US Company With a Global Talent Network.</h2>
            <p>RemoteCore is headquartered in Fall River, Massachusetts, and recruits professionals from {REGIONS_TEXT}. You work with a team based in the United States, with access to skilled people across time zones.</p>
          </div>
        </div>
      </section>

      <Close title="Let’s Build Something Better Together.">
        <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
        <a className="btn btn--line" href="/find-opportunities">Join Our Talent Network</a>
      </Close>
    </>
  );
}
