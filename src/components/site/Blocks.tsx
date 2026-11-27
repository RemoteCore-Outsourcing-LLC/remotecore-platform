import type { ReactNode } from "react";
import { heroFor } from "@/lib/settings";

// page: the key in lib/heroes.ts. The title and intro come from the admin settings, or the built in text.
export async function PageHero({ page, children, badge, aside }: { page: string; children?: ReactNode; badge?: string; aside?: ReactNode }) {
  const { eyebrow, title, lede } = await heroFor(page);
  return (
    <section className="phero">
      <div className={aside ? "wrap phero__in" : "wrap"}>
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1>{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {children && <div className="btns">{children}</div>}
          {badge && <p className="badge"><i aria-hidden="true" />{badge}</p>}
        </div>
        {aside}
      </div>
    </section>
  );
}

// Where our talent comes from, said the same way everywhere (Kemar's doc 2026-11-26, part 3.3).
export const REGIONS_TEXT = "the Caribbean, Latin America, the Philippines and Africa, matched to each client’s needs";

// The line above the example profile cards on the homepage and the Talent Marketplace (part 3.2).
export const EXAMPLE_LINE = "These examples show the kind of shortlist you’ll receive. Tell us your role and we’ll send real, pre-screened candidates within 3 business days.";

// One flat placement fee, shown on the homepage and on Hire Talent (part 2.2).
// The owners have not set a top hourly rate yet, so the rate row reads "From $5/hr".
export function Pricing() {
  const rows: [string, string, string][] = [
    ["Typical hourly rate (paid to your hire)", "From $5/hr", "From $5/hr"],
    ["One-time placement fee", "Starting at $1,000", "Starting at $1,000"],
    ["Replacement guarantee", "60 days", "60 days"],
  ];
  return (
    <section className="sec pricing" id="pricing" aria-labelledby="pricing-h">
      <div className="wrap">
        <div className="head" data-sc-in>
          <h2 id="pricing-h">Simple, one-time pricing</h2>
          <p className="lede">You pay one flat placement fee, only after you choose your hire. After that, you pay your professional directly, with no monthly markups and no agency cut from their wages.</p>
        </div>
        <div className="pricing__box" data-sc-in>
          <table className="pricing__table">
            <thead><tr><td /><th scope="col">Part-time</th><th scope="col">Full-time</th></tr></thead>
            <tbody>
              {rows.map(([label, part, full]) => (
                <tr key={label}><th scope="row">{label}</th><td data-label="Part-time">{part}</td><td data-label="Full-time">{full}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="pricing__foot">
            <p>Specialized roles (developers, bookkeepers, estimators) are quoted per role.</p>
            <a className="btn btn--main" href="/book-consultation">Get my custom quote</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// The three promises shown next to the main call to action on Our Services and Hire Talent.
export const TRUST = ["Starting at $5/hr (Paid directly to your hire)", "$0 Upfront Deposit (Pay only when you hire)", "60-Day Free Replacement Guarantee"];

export function Close({ title, text, children, compact, trust }: { title: string; text?: string; children: ReactNode; compact?: boolean; trust?: boolean }) {
  return (
    <section className={compact ? "close close--compact" : "close"}>
      <div className="wrap">
        <div>
          <h2>{title}</h2>
          {text && <p>{text}</p>}
          {trust && (
            <ul className="trust">
              {TRUST.map((t) => (
                <li key={t}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>{t}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="btns">{children}</div>
      </div>
    </section>
  );
}

export function Steps({ items, five }: { items: { title: string; text: string; action?: ReactNode }[]; five?: boolean }) {
  return (
    <ol className={five ? "steps steps--five" : "steps"} data-sc-in data-sc-stagger="70">
      {items.map((s) => (
        <li key={s.title}>
          <h3>{s.title}</h3>
          <p>{s.text}</p>
          {s.action}
        </li>
      ))}
    </ol>
  );
}

export function Faq({ items }: { items: [string, string][] }) {
  return (
    <div className="faq">
      {items.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  );
}

const icons: Record<string, ReactNode> = {
  health: <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10zM12 9v5M9.5 11.5h5" />,
  support: <path d="M4 13v-1a8 8 0 0 1 16 0v1M4 13h3v5H5a1 1 0 0 1-1-1zM20 13h-3v5h2a1 1 0 0 0 1-1zM17 18c0 2-2 3-5 3" />,
  assist: <path d="M4 6h16v12H4zM4 7l8 6 8-6" />,
  sales: <path d="M4 19V9M10 19V5M16 19v-7M22 19H2" />,
  match: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20a6 6 0 0 1 12 0M16 11l2 2 4-4" />,
  insight: <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z" />,
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />,
  growth: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7" />,
  chat: <path d="M4 5h16v11H8l-4 4z" />,
  doc: <path d="M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6" />,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  laptop: <path d="M5 5h14v10H5zM2 19h20" />,
  tech: <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 6l-2 12" />,
  money: <path d="M3 7h18v10H3zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />,
  plan: <path d="M4 20h16M6 16V9l6-5 6 5v7M10 20v-5h4v5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  home: <path d="M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6" />,
  globe: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />,
  clipboard: <path d="M9 4h6v3H9zM7 5H5v16h14V5h-2M8 12h8M8 16h5" />,
  receipt: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6M9 16h3" />,
};

export function Icon({ name }: { name: keyof typeof icons | string }) {
  return (
    <span className="ico" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {icons[name] ?? icons.star}
      </svg>
    </span>
  );
}
