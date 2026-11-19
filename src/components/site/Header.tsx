"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { nav, loginLinks, type NavLink } from "@/lib/site";
import { Logo } from "./Logo";

const Caret = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

// A small menu that opens on click, closes on Escape or a click outside, and works with the keyboard.
function Drop({ id, label, links, path, button = false, open, setOpen }: {
  id: string; label: string; links: NavLink[]; path: string; button?: boolean; open: string; setOpen: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isOpen = open === id;
  const current = links.some((l) => l.href === path);
  useEffect(() => {
    if (!isOpen) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(""); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(""); ref.current?.querySelector("button")?.focus(); } };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [isOpen, setOpen]);
  return (
    <div className="dd" ref={ref} onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(""); }}>
      <button
        type="button"
        className={button ? "btn btn--ghost btn--sm dd__btn" : "dd__btn dd__btn--nav"}
        aria-expanded={isOpen}
        aria-controls={`dd-${id}`}
        data-current={current || undefined}
        onClick={() => setOpen(isOpen ? "" : id)}
      >
        {label}<Caret />
      </button>
      <div className="dd__menu" id={`dd-${id}`} hidden={!isOpen}>
        {links.map((l) => (
          <a key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>{l.label}</a>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const [sheet, setSheet] = useState(false);
  const [open, setOpen] = useState("");
  const path = usePathname();
  return (
    <>
      <header className="bar">
        <div className="wrap bar__in">
          <Logo />
          <nav aria-label="Main">
            {nav.map((n) => "children" in n ? (
              <Drop key={n.label} id="talent" label={n.label} links={n.children} path={path} open={open} setOpen={setOpen} />
            ) : (
              <a key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>{n.label}</a>
            ))}
          </nav>
          <div className="bar__right">
            <div className="login"><Drop id="login" label="Log In" links={loginLinks} path={path} button open={open} setOpen={setOpen} /></div>
            <a className="btn btn--main btn--sm book" href="/book-consultation">Book a Consultation</a>
            <button
              type="button"
              className="menu-btn"
              aria-expanded={sheet}
              aria-controls="sheet"
              aria-label={sheet ? "Close menu" : "Open menu"}
              onClick={() => setSheet(!sheet)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                {sheet ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
      {sheet && (
        <div className="sheet" id="sheet">
          <div className="wrap">
            <nav aria-label="Menu">
              <a href="/">Home</a>
              {nav.map((n) => "children" in n ? (
                <div key={n.label} className="sheet__group">
                  <p className="sheet__label">{n.label}</p>
                  {n.children.map((c) => <a key={c.href} href={c.href} aria-current={path === c.href ? "page" : undefined}>{c.label}</a>)}
                </div>
              ) : (
                <a key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>{n.label}</a>
              ))}
            </nav>
            <div className="btns">
              <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
              {loginLinks.map((l) => <a key={l.href} className="btn btn--ghost" href={l.href}>{l.label}</a>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
