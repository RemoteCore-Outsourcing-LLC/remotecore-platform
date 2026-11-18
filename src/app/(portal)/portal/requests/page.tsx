import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead, Empty } from "@/components/portal/Dash";
import { NotApproved } from "@/components/portal/EmployerGate";
import { REQUEST_STATUS } from "@/lib/employer";
import { shortDate } from "@/lib/portal/seeker";

export const metadata: Metadata = { title: "Staffing requests", robots: { index: false } };

export default async function Requests({ searchParams }: { searchParams: Promise<{ sent?: string }> }) {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const { sent } = await searchParams;
  const { data } = await sb.from("staffing_requests").select("id, position, number_needed, start_date, status, created_at").eq("company_id", company.id).order("created_at", { ascending: false });
  const rows = data ?? [];
  return (
    <div className="pwrap">
      <PageHead title="Staffing requests" sub="Ask RemoteCore to find people for you, without a public job post." aside={<a className="btn btn--main btn--sm" href="/portal/requests/new">New request</a>} />
      {sent && <p className="notice" role="status">Request sent. A recruiter will contact you about next steps.</p>}
      {rows.length === 0 ? (
        <Empty title="No requests yet" action={<a className="btn btn--main btn--sm" href="/portal/requests/new">Send a staffing request</a>}>Tell us who you need and our recruiters find and screen candidates for you.</Empty>
      ) : (
        <section className="panel" aria-label="Your requests">
          <ul className="rows">
            {rows.map((r) => {
              const s = REQUEST_STATUS[r.status] ?? { label: r.status, tone: "neutral" };
              return (
                <li key={r.id}>
                  <div>
                    <span className="rows__title">{r.position}{r.number_needed > 1 ? `, ${r.number_needed} people` : ""}</span>
                    <span className="soft small">Sent {shortDate(r.created_at)}{r.start_date ? ` · Start ${shortDate(r.start_date)}` : ""} · Reference {r.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                  <span className={`pill pill--${s.tone}`}>{s.label}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
