import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { PageHead } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { ReplyForm } from "@/components/portal/SiteClient";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

// One employer's conversation with the team. Opening it marks their messages read.
export default async function Thread({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, admin } = await getAdmin();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: c } = await sb.from("companies").select("id, name, contact_person, email, owner_id").eq("id", id).maybeSingle();
  if (!c) notFound();
  const { data: rows } = await sb.from("messages").select("id, body, created_at, sender_id, profiles!messages_sender_id_fkey(full_name)").eq("company_id", id).order("created_at").limit(500);
  await sb.from("messages").update({ read_at: new Date().toISOString() }).eq("company_id", id).is("read_at", null);
  const msgs = rows ?? [];
  return (
    <div className="pwrap pwrap--narrow">
      <p className="crumb"><a href="/portal/admin/inbox?tab=messages">Employer messages</a></p>
      <PageHead title={c.name} sub={`${c.contact_person} · ${c.email}`} aside={<a className="btn btn--ghost btn--sm" href={`/portal/admin/users/${c.owner_id}`}>Company account</a>} />
      <section className="panel" aria-label={`Conversation with ${c.name}`}>
        <ol className="thread">
          {msgs.map((m) => {
            const team = m.sender_id !== c.owner_id;
            const who = (m.profiles as unknown as { full_name: string } | null)?.full_name;
            return (
              <li key={m.id} className={team ? "is-mine" : ""}>
                <span className="thread__who small">{team ? `${who || "RemoteCore"} (team)` : c.contact_person} · <LocalTime iso={m.created_at} /></span>
                <p className="thread__body">{m.body}</p>
              </li>
            );
          })}
        </ol>
        <div className="thread__compose"><ReplyForm companyId={c.id} /></div>
      </section>
    </div>
  );
}
