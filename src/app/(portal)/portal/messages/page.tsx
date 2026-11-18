import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";
import { MessageBox } from "@/components/portal/CandidateClient";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function Messages({ searchParams }: { searchParams: Promise<{ about?: string }> }) {
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const { about } = await searchParams;

  const [{ data: rows }, aboutApp] = await Promise.all([
    sb.from("messages").select("id, body, created_at, sender_id").eq("company_id", company.id).order("created_at", { ascending: true }).limit(200),
    about && /^[0-9a-f-]{36}$/i.test(about)
      ? sb.from("applications").select("id, jobs!inner(title, company_id), profiles!applications_seeker_id_fkey(full_name)").eq("id", about).eq("jobs.company_id", company.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const msgs = rows ?? [];
  const a = aboutApp.data as { id: string; jobs: { title: string }; profiles: { full_name: string } | null } | null;
  const aboutLabel = a ? `${a.profiles?.full_name || "this candidate"}, ${a.jobs.title}` : undefined;

  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Messages" sub="Write to the RemoteCore team here. We reply on this page and by email." />
      <section className="panel" aria-label="Conversation with RemoteCore">
        {msgs.length === 0 ? (
          <Empty title="No messages yet">Your conversation with RemoteCore shows up here.</Empty>
        ) : (
          <ol className="thread">
            {msgs.map((m) => {
              const mine = m.sender_id === user.id;
              return (
                <li key={m.id} className={mine ? "is-mine" : ""}>
                  <span className="thread__who small">{mine ? "You" : "RemoteCore"} · <LocalTime iso={m.created_at} /></span>
                  <p className="thread__body">{m.body}</p>
                </li>
              );
            })}
          </ol>
        )}
        <div className="thread__compose"><MessageBox about={a?.id} aboutLabel={aboutLabel} /></div>
      </section>
    </div>
  );
}
