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
            <h2>Our story</h2>
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
          <div className="head" data-sc-in><h2>Our values</h2></div>
          <dl className="ledger" data-sc-in>
            {values.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
          </dl>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split split--top">
          <div data-sc-in>
            <p className="eyebrow" style={{ color: "var(--teal)" }}>About our leadership</p>
            <h2>Built on Experience. Driven by Purpose.</h2>
          </div>
          <div data-sc-in>
            <p className="lede" style={{ marginTop: 0 }}>RemoteCore Outsourcing was founded with a vision to bridge the gap between businesses seeking dependable talent and skilled professionals looking for meaningful career opportunities.</p>
            <p className="lede">Our leadership brings experience across customer service, administration, team management, business operations, and workforce coordination.</p>
            <p className="lede">We believe successful recruitment is about more than filling vacancies. It&apos;s about creating opportunities, building lasting partnerships, and helping businesses grow with confidence.</p>
            <p className="lede" style={{ color: "var(--sc-ink)", fontWeight: 600 }}>Great talent knows no borders. Great partnerships create lasting success.</p>
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
