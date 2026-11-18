"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { nav } from "@/lib/site";
import { Logo } from "./Logo";

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  return (
    <>
      <header className="bar">
        <div className="wrap bar__in">
          <Logo />
          <nav aria-label="Main">
            {nav.map((n) => (
              <a key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>
                {n.label}
              </a>
            ))}
          </nav>
          <div className="bar__right">
            <a className="btn btn--ghost btn--sm login" href="/login?as=client">Client Login</a>
            <a className="btn btn--ghost btn--sm login" href="/login?as=applicant">Applicant Login</a>
            <a className="btn btn--main btn--sm" href="/book-consultation">Book a Consultation</a>
            <button
              type="button"
              className="menu-btn"
              aria-expanded={open}
              aria-controls="sheet"
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen(!open)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
      </header>
      {open && (
        <div className="sheet" id="sheet">
          <div className="wrap">
            <nav aria-label="Menu">
              <a href="/">Home</a>
              {nav.map((n) => (
                <a key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>
                  {n.label}
                </a>
              ))}
            </nav>
            <div className="btns">
              <a className="btn btn--main" href="/book-consultation">Book a Consultation</a>
              <a className="btn btn--ghost" href="/login?as=client">Client Login</a>
              <a className="btn btn--ghost" href="/login?as=applicant">Applicant Login</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
