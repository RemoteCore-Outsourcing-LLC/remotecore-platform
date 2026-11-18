import { COMPANY_STATUS } from "@/lib/employer";

export type Company = {
  id: string; name: string; contact_person: string; email: string; phone: string | null; country: string | null;
  website: string | null; industry: string | null; description: string | null; status: string; created_at: string; approved_at: string | null;
};

export function CompanyPill({ status }: { status: string }) {
  const s = COMPANY_STATUS[status] ?? { label: status, tone: "neutral" };
  return <span className={`pill pill--${s.tone}`}>{s.label}</span>;
}

// The three steps a new employer goes through, with the current one marked.
export function ApprovalSteps({ status }: { status: string }) {
  const steps = [
    { t: "Email confirmed", d: "Your login works." },
    { t: "RemoteCore reviews your company", d: "We check every new company account before it opens." },
    { t: "Start hiring", d: "Post jobs, send staffing requests and review candidates." },
  ];
  const at = status === "approved" ? 3 : 1;
  return (
    <ol className="esteps">
      {steps.map((s, i) => (
        <li key={s.t} className={i < at ? "is-done" : i === at ? "is-now" : ""} aria-current={i === at ? "step" : undefined}>
          <b>{s.t}</b><span>{s.d}</span>
        </li>
      ))}
    </ol>
  );
}

export function CompanyFacts({ c }: { c: Company }) {
  return (
    <dl className="facts">
      <dt>Company</dt><dd>{c.name}</dd>
      <dt>Contact person</dt><dd>{c.contact_person}</dd>
      <dt>Business email</dt><dd>{c.email}</dd>
      {c.phone && <><dt>Phone</dt><dd>{c.phone}</dd></>}
      {c.country && <><dt>Country</dt><dd>{c.country}</dd></>}
      {c.industry && <><dt>Industry</dt><dd>{c.industry}</dd></>}
      {c.website && <><dt>Website</dt><dd><a href={c.website} target="_blank" rel="noopener noreferrer">{c.website.replace(/^https?:\/\//, "")}</a></dd></>}
    </dl>
  );
}
