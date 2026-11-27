"use client";
import { useState, type FormEvent, type ReactNode } from "react";

type Props = {
  kind: string;
  submitLabel: string;
  thanksTitle?: string;
  thanksText: string;
  children: ReactNode;
  note?: string;
};

// Sends the form to /api/forms/<kind> and answers in place.
export function Form({ kind, submitLabel, thanksTitle = "Thank you.", thanksText, children, note }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  // The server can send its own thank you text (for example the booked call time).
  const [thanks, setThanks] = useState<{ title?: string; text?: string }>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    setState("sending");
    setError("");
    try {
      const res = await fetch(`/api/forms/${kind}`, { method: "POST", body: new FormData(form) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) {
        // A picked time was taken a moment ago: reload the open times.
        if (out.taken) window.dispatchEvent(new Event("slots:refresh"));
        throw new Error(out.error || "Something went wrong. Please try again.");
      }
      setThanks({ title: out.thanksTitle, text: out.thanks });
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="thanks" role="status" tabIndex={-1}>
        <span className="ok" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </span>
        <h3>{thanks.title ?? thanksTitle}</h3>
        <p>{thanks.text ?? thanksText}</p>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      {children}
      <div className="hp" aria-hidden="true"><input name="company_site" tabIndex={-1} autoComplete="off" aria-hidden="true" /></div>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn--main" type="submit" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : submitLabel}
      </button>
      {note && <small>{note}</small>}
    </form>
  );
}

export function Field({ label, name, type = "text", required, optional, placeholder, autoComplete, rows }: {
  label: string; name: string; type?: string; required?: boolean; optional?: boolean; placeholder?: string; autoComplete?: string; rows?: number;
}) {
  return (
    <label className="field">
      <span>{label}{optional && <em> (optional)</em>}</span>
      {type === "textarea" ? (
        <textarea name={name} required={required} placeholder={placeholder} rows={rows ?? 4} maxLength={4000} />
      ) : (
        <input name={name} type={type} required={required} placeholder={placeholder} autoComplete={autoComplete} maxLength={300} />
      )}
    </label>
  );
}

export function Select({ label, name, options, required, optional }: { label: string; name: string; options: string[]; required?: boolean; optional?: boolean }) {
  return (
    <label className="field">
      <span>{label}{optional && <em> (optional)</em>}</span>
      <select name={name} required={required} defaultValue="">
        <option value="" disabled>Select an option</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
}

export function Consent({ name = "consent", children }: { name?: string; children: ReactNode }) {
  return (
    <label className="check">
      <input type="checkbox" name={name} value="yes" required />
      <span>{children}</span>
    </label>
  );
}
