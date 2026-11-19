import { getSettings } from "@/lib/settings";

// Client testimonials and key numbers, above the last call to action on the homepage.
// Filled in by the team on Admin > Website. Shows nothing until there is at least one real item.
export async function Proof() {
  const { proof } = await getSettings();
  if (!proof.quotes.length && !proof.stats.length) return null;
  return (
    <section className="sec proof" aria-labelledby="proof-h">
      <div className="wrap">
        <div className="head" data-sc-in><h2 id="proof-h">{proof.title}</h2></div>
        {proof.stats.length > 0 && (
          <dl className="proof__stats" data-sc-in>
            {proof.stats.map((s) => <div key={s.label}><dt>{s.label}</dt><dd>{s.value}</dd></div>)}
          </dl>
        )}
        {proof.quotes.length > 0 && (
          <div className="proof__quotes" data-sc-in data-sc-stagger="70">
            {proof.quotes.map((q) => (
              <figure key={q.name + q.quote.slice(0, 20)} className="card">
                <blockquote><p>{q.quote}</p></blockquote>
                <figcaption><b>{q.name}</b>{q.role && <span>{q.role}</span>}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
