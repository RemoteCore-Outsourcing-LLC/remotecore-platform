import type { Metadata } from "next";
import { getSession } from "@/lib/supabase/server";
import { ago } from "@/lib/portal/seeker";
import { Empty, PageHead } from "@/components/portal/Dash";
import { MarkAllReadButton } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "Notifications", robots: { index: false } };

// Only links inside the platform are followed.
const safe = (l: string | null) => (l && l.startsWith("/") && !l.startsWith("//") ? l : null);

export default async function NotificationsPage() {
  const { sb, user } = await getSession();
  if (!user) return null;
  const { data } = await sb.from("notifications").select("id, title, body, link, read_at, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100);
  const list = data ?? [];
  const unread = list.filter((n) => !n.read_at).length;
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Notifications" sub={list.length ? (unread ? `${unread} unread` : "All caught up") : undefined} aside={unread > 0 ? <MarkAllReadButton /> : undefined} />
      {list.length === 0 ? (
        <Empty title="Nothing new">Updates about your applications show up here and in your email.</Empty>
      ) : (
        <ul className="panel rows rows--notes">
          {list.map((n) => {
            const href = safe(n.link);
            return (
              <li key={n.id} className={n.read_at ? "" : "is-unread"}>
                <div>
                  {href ? <a className="rows__title" href={href}>{n.title}</a> : <span className="rows__title">{n.title}</span>}
                  {n.body && <span className="soft small">{n.body}</span>}
                </div>
                <span className="soft small nowrap">{ago(n.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
