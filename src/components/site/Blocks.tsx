import type { ReactNode } from "react";

export function PageHero({ eyebrow, title, lede, children, badge }: { eyebrow?: string; title: string; lede?: string; children?: ReactNode; badge?: string }) {
  return (
    <section className="phero">
      <div className="wrap">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {lede && <p className="lede">{lede}</p>}
        {children && <div className="btns">{children}</div>}
        {badge && <p className="badge"><i aria-hidden="true" />{badge}</p>}
      </div>
    </section>
  );
}

export function Close({ title, text, children }: { title: string; text?: string; children: ReactNode }) {
  return (
    <section className="close">
      <div className="wrap">
        <div>
          <h2>{title}</h2>
          {text && <p>{text}</p>}
        </div>
        <div className="btns">{children}</div>
      </div>
    </section>
  );
}

export function Steps({ items }: { items: { title: string; text: string; action?: ReactNode }[] }) {
  return (
    <ol className="steps" data-sc-in data-sc-stagger="70">
      {items.map((s, i) => (
        <li key={s.title}>
          <span className="num" aria-hidden="true">{i + 1}</span>
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
