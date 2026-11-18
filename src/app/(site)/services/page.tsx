import type { Metadata } from "next";
import { Close, Icon, PageHero } from "@/components/site/Blocks";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Our Services", description: "Remote professionals for healthcare administration, customer support, virtual and executive assistance, sales support, and custom recruitment." };


export default async function Services() {
  const { services: { main, more } } = await getSettings();
  return (
    <>
      <PageHero page="services">
        <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
        <a className="btn btn--line" href="/book-consultation">Book a Consultation</a>
      </PageHero>

      <section className="sec">
        <div className="wrap cards" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }} data-sc-in data-sc-stagger="70">
          {main.map((s) => (
            <article key={s.name} className="card" id={s.icon}>
              <Icon name={s.icon} />
              <span className="tag">{s.name}</span>
              <h3>{s.title}</h3>
              <ul>{s.items.map((i) => <li key={i}>{i}</li>)}</ul>
              {s.note && <p className="note">{s.note}</p>}
            </article>
          ))}
        </div>
      </section>

      <section className="sec sec--pale">
        <div className="wrap">
          <div className="head" data-sc-in><h2>More roles we recruit for</h2></div>
          <div className="cards" data-sc-in data-sc-stagger="70">
            {more.map((m) => (
              <article key={m.name} className="card"><Icon name={m.icon} /><h3>{m.name}</h3><p>{m.text}</p></article>
            ))}
          </div>
        </div>
      </section>

      <Close title="Your Business Is Unique. Your Hiring Should Be Too." text="Tell us the skills, experience, schedule, and responsibilities you need. We will work to identify suitable candidates.">
        <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
      </Close>
    </>
  );
}
