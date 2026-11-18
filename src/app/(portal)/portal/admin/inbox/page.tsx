import type { Metadata } from "next";
import { Fragment } from "react";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { FORM_NAMES } from "@/lib/email/templates";
import { ago } from "@/lib/portal/seeker";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { InboxControls } from "@/components/portal/SiteClient";

export const metadata: Metadata = { title: "Inbox", robots: { index: false } };

const STATUS: Record<string, { label: string; tone: string }> = { new: { label: "New", tone: "info" }, in_review: { label: "In progress", tone: "neutral" }, closed: { label: "Done", tone: "good" } };
const field = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
type Item = { kind: "request" | "form"; id: string; type: string; title: string; who: string; email: string | null; status: string; note: string | null; created_at: string; fields: [string, string][] };

// Staffing requests, every public form and employer messages, in one place.
export default async function Inbox({ searchParams }: { searchParams: Promise<{ tab?: string; show?: string }> }) {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const sp = await searchParams;
  const [reqs, forms, msgs] = await Promise.all([
    sb.from("staffing_requests").select("*").order("created_at", { ascending: false }).limit(500),
    sb.from("form_submissions").select("id, kind, email, data, status, note, created_at").order("created_at", { ascending: false }).limit(1000),
    sb.from("messages").select("id, company_id, sender_id, body, created_at, read_at, companies(name, owner_id)").order("created_at", { ascending: false }).limit(1000),
  ]);
  const items: Item[] = [
    ...(reqs.data ?? []).map((r) => ({
      kind: "request" as const, id: r.id, type: "dashboard-request", title: `${r.position}${r.number_needed ? `, ${r.number_needed} ${r.number_needed === 1 ? "hire" : "hires"}` : ""}`,
      who: r.company_name || r.contact_name || "Employer", email: r.email, status: r.status, note: r.note, created_at: r.created_at,
      fields: ([["Contact", r.contact_name], ["Phone", r.phone], ["Industry", r.industry], ["Skills", r.skills], ["Experience", r.experience_level], ["Pay", r.compensation], ["Region", r.region], ["Start", r.start_date], ["Details", r.details]] as [string, string | null][]).filter(([, v]) => v) as [string, string][],
    })),
    ...(forms.data ?? []).map((f) => {
      const d = (f.data ?? {}) as Record<string, string>;
      return {
        kind: "form" as const, id: f.id, type: f.kind, title: FORM_NAMES[f.kind] ?? field(f.kind),
        who: d.company || d.full_name || d.contact_name || f.email || "Visitor", email: f.email, status: f.status, note: f.note, created_at: f.created_at,
        fields: Object.entries(d).filter(([k, v]) => v && !["consent", "website_url"].includes(k)).map(([k, v]) => [field(k), String(v)] as [string, string]),
      };
    }),
  ].sort((a, b) => b.created_at.localeCompare(a.created_at));

  // Employer threads: one row per company, newest first, with unread messages from the employer.
  type Thread = { id: string; name: string; last: string; at: string; unread: number };
  const threads = new Map<string, Thread>();
  for (const m of msgs.data ?? []) {
    const c = m.companies as unknown as { name: string; owner_id: string } | null;
    const t = threads.get(m.company_id) ?? { id: m.company_id, name: c?.name ?? "Employer", last: m.body, at: m.created_at, unread: 0 };
    if (!m.read_at && m.sender_id === c?.owner_id) t.unread++;
    threads.set(m.company_id, t);
  }
  const threadList = [...threads.values()];
  const unreadMsgs = threadList.reduce((n, t) => n + t.unread, 0);

  const TABS = [["open", "Open"], ["requests", "Staffing requests"], ["forms", "Website forms"], ["messages", "Employer messages"], ["done", "Done"]] as const;
  const tab = TABS.some(([k]) => k === sp.tab) ? sp.tab! : "open";
  const shown = tab === "open" ? items.filter((i) => i.status !== "closed")
    : tab === "requests" ? items.filter((i) => i.kind === "request" || i.type === "staffing-request")
    : tab === "forms" ? items.filter((i) => i.kind === "form")
    : tab === "done" ? items.filter((i) => i.status === "closed") : [];
  const count: Record<string, number> = {
    open: items.filter((i) => i.status !== "closed").length, requests: items.filter((i) => i.kind === "request" || i.type === "staffing-request").length,
    forms: items.filter((i) => i.kind === "form").length, messages: unreadMsgs, done: items.filter((i) => i.status === "closed").length,
  };

  return (
    <div className="pwrap">
      <PageHead title="Inbox" sub="Staffing requests, website forms and employer messages. Mark each one done when it is handled." />
      <nav className="seg seg--tabs" aria-label="Inbox">
        {TABS.map(([k, l]) => <a key={k} href={`/portal/admin/inbox?tab=${k}`} aria-current={tab === k ? "page" : undefined}>{l} <b>{count[k]}</b></a>)}
      </nav>
      {tab === "messages" ? (
        <section className="panel" aria-label="Employer messages">
          {threadList.length === 0 ? <Empty title="No messages yet">When an employer writes from their dashboard, the conversation shows up here.</Empty> : (
            <ul className="rows crows">
              {threadList.map((t) => (
                <li key={t.id} className={t.unread ? "is-unread" : ""}>
                  <div className="crows__who"><a className="rows__title" href={`/portal/admin/inbox/messages/${t.id}`}>{t.name}</a><span className="soft small clamp">{t.last}</span></div>
                  <span className="soft small nowrap">{ago(t.at)}</span>
                  {t.unread > 0 ? <span className="pill pill--info">{t.unread} new</span> : <span className="pill">Read</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : shown.length === 0 ? (
        <section className="panel"><Empty title={tab === "open" ? "All caught up" : "Nothing here"}>{tab === "open" ? "New requests and form messages show up here." : "Try another tab."}</Empty></section>
      ) : (
        <div className="apps">
          {shown.map((i) => (
            <article key={i.id} className="app inbox">
              <header className="app__head">
                <div>
                  <h2>{i.title}</h2>
                  <p className="soft small">{i.who !== i.email && <>{i.who} · </>}{i.email ? <a href={`mailto:${i.email}`}>{i.email}</a> : null} · <LocalTime iso={i.created_at} />{i.kind === "request" ? " · From the employer dashboard" : ""}</p>
                </div>
                <span className={`pill pill--${STATUS[i.status]?.tone ?? "neutral"}`}>{STATUS[i.status]?.label ?? i.status}</span>
              </header>
              <details className="app__hist" open={sp.show === i.id}>
                <summary>Details</summary>
                <dl className="facts" style={{ marginTop: 10 }}>{i.fields.map(([k, v], n) => <Fragment key={n}><dt>{k}</dt><dd className="prose">{v}</dd></Fragment>)}</dl>
              </details>
              <InboxControls kind={i.kind} id={i.id} status={i.status} note={i.note} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
