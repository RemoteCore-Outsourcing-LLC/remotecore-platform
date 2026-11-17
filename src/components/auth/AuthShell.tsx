import type { ReactNode } from "react";

export function AuthShell({ title, lede, children }: { title: string; lede: string; children: ReactNode }) {
  return (
    <section className="phero auth">
      <div className="wrap auth__in">
        <div className="auth__side">
          <h1>{title}</h1>
          <p className="lede">{lede}</p>
        </div>
        <div className="panel auth__panel">{children}</div>
      </div>
    </section>
  );
}
