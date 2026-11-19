import type { Metadata } from "next";
import { Close, Icon, PageHero } from "@/components/site/Blocks";

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
      <PageHero page="about" />

      <section className="sec">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>Our Story</h2>
            <p className="lede">Our approach is informed by firsthand experience in healthcare administration, customer support, and remote business operations. We understand how important clear communication, reliable support, and the right team members are to daily operations. RemoteCore connects businesses with professionals while supporting career growth through practical learning and preparation.</p>
          </div>
          <div className="cards" data-sc-in data-sc-stagger="80">
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

      <section className="sec">
        <div className="wrap split split--top">
          <div data-sc-in>
            <p className="eyebrow" style={{ color: "var(--teal)" }}>About our leadership</p>
            <h2>Leadership Grounded in Real-World Operations.</h2>
          </div>
          <div data-sc-in>
            <p className="lede" style={{ marginTop: 0 }}>Our leadership team has hands-on experience managing remote teams, supporting healthcare administrative workflows, and running the daily operations of a business.</p>
            <p className="lede">That experience shapes how we screen candidates and how we match each person to the role, the schedule, and the team they will join.</p>
            <p className="lede" style={{ color: "var(--sc-ink)", fontWeight: 600 }}>Great talent knows no borders. Great partnerships create lasting success.</p>
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="card card--dark bridge" data-sc-in>
            <Icon name="globe" />
            <h2>A US Company With a Global Talent Network.</h2>
            <p>RemoteCore is headquartered in Fall River, Massachusetts, and recruits professionals from the Caribbean, Latin America, and the Philippines. You work with a team based in the United States, with access to skilled people across time zones.</p>
          </div>
        </div>
      </section>

      <Close title="Let’s Build Something Better Together.">
        <a className="btn btn--main" href="/hire-talent">Hire Talent</a>
        <a className="btn btn--line" href="/find-opportunities">Join Our Talent Network</a>
      </Close>
    </>
  );
}
