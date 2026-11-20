import type { Metadata } from "next";
import { Close, Icon, PageHero } from "@/components/site/Blocks";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Our Services", description: "Remote professionals for healthcare administration, customer support, virtual and executive assistance, sales support, and custom recruitment." };

// The small link under each main service. Kept here, by icon, so it survives edits on Admin > Website.
const CTA: Record<string, { label: string; href: string }> = {
  health: { label: "Browse Healthcare Talent", href: "/talent-marketplace" },
  support: { label: "Browse Support Talent", href: "/talent-marketplace" },
  assist: { label: "Request an Assistant", href: "/hire-talent#request" },
  sales: { label: "Request Sales Support", href: "/hire-talent#request" },
  default: { label: "Request Support", href: "/hire-talent#request" },
};

export default async function Services() {
  const { services: { main, more } } = await getSettings();
  return (
    <>
      <PageHero page="services">
        <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
        <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
      </PageHero>

      <section className="sec">
        <div className="wrap">
          <div className="head" data-sc-in><h2>Core Staffing &amp; Outsourcing Solutions</h2></div>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))" }} data-sc-in data-sc-stagger="70">
            {main.map((s) => {
              const cta = CTA[s.icon] ?? CTA.default;
              return (
                <article key={s.name} className="card svc-main" id={s.icon}>
                  <Icon name={s.icon} />
                  <h3>{s.name}</h3>
                  <p className="svc-main__sub">{s.title}</p>
                  <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
                  {s.note && <p className="note">{s.note}</p>}
                  <a className="svc-main__link" href={cta.href}>{cta.label} <span aria-hidden="true">→</span></a>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="head" data-sc-in><h2>Additional Specialized Roles</h2></div>
          <div className="cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))" }} data-sc-in data-sc-stagger="70">
            {more.map((m) => (
              <article key={m.name} className="card"><Icon name={m.icon} /><h3>{m.name}</h3><p>{m.text}</p></article>
            ))}
            <article className="card">
              <Icon name="plus" />
              <h3>Custom Roles</h3>
              <p>Need something different? We’ll recruit talent based on your specific requirements.</p>
              <a className="svc-main__link" href="/hire-talent#request" style={{ whiteSpace: "nowrap" }}>Request Custom Role <span aria-hidden="true">→</span></a>
            </article>
          </div>
        </div>
      </section>

      <Close trust title="Your Business Is Unique. Your Hiring Should Be Too." text="Tell us the skills, experience, schedule, and responsibilities you need. We will work to identify suitable candidates.">
        <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
        <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
      </Close>
    </>
  );
}
