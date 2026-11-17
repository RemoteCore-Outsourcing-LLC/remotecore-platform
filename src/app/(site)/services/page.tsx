import type { Metadata } from "next";
import { Close, Icon, PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "Our Services", description: "Remote professionals for healthcare administration, customer support, virtual and executive assistance, sales support, and custom recruitment." };

const main = [
  { icon: "health", name: "Healthcare Administrative Support", title: "Helping Healthcare Teams Focus on Patient Care.", items: ["Appointment scheduling", "Patient intake and registration", "Insurance eligibility and benefits verification", "Medical records and EHR documentation", "Referral and follow up coordination", "Pharmacy communication and administrative support"], note: "Tasks are performed within client authorized workflows, applicable privacy requirements, and role scope." },
  { icon: "support", name: "Customer Experience & Support", title: "Every Interaction Matters.", items: ["Inbound phone support", "Email and live chat", "Ticket management", "Customer follow ups", "Issue resolution", "CRM documentation", "Escalation coordination"] },
  { icon: "assist", name: "Virtual & Executive Assistance", title: "Less Administrative Work. More Room to Grow.", items: ["Inbox and calendar management", "Scheduling", "Document preparation", "Research", "Data entry", "Meeting coordination", "General administrative support"] },
  { icon: "sales", name: "Sales & Business Support", title: "Keep Your Business Moving.", items: ["Lead research", "Appointment setting", "CRM updates", "Outreach follow ups", "Pipeline administration", "Reporting support"] },
];
const more = [
  ["tech", "Technology & IT", "Technical support, IT help desk, software troubleshooting and digital operations."],
  ["money", "Finance & Accounting", "Bookkeeping, invoicing, payroll administration, expense tracking and financial reporting support."],
  ["plan", "Project Managers & Estimators", "Project coordination, scheduling, cost estimation, budgeting, progress tracking and reporting."],
];

export default function Services() {
  return (
    <>
      <PageHero eyebrow="Our Services" title="Solutions That Move Your Business Forward." lede="Every growing business reaches a point where the right support makes all the difference. RemoteCore helps you find professionals who can take on essential responsibilities and give your team more time to focus on what matters most.">
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
            {more.map(([icon, t, d]) => (
              <article key={t} className="card"><Icon name={icon} /><h3>{t}</h3><p>{d}</p></article>
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
