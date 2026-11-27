import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { incompleteSignups, REMINDER_PLAN } from "@/lib/signup-reminders";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";

export const metadata: Metadata = { title: "Unfinished sign ups", robots: { index: false } };
export const dynamic = "force-dynamic";

// Job seekers who made an account but never submitted their application, with the reminder emails they got.
export default async function UnfinishedSignups() {
  const { admin } = await getAdmin();
  if (!admin) notFound();
  const list = await incompleteSignups();
  const status = (s: (typeof list)[number]) =>
    s.off ? "Unsubscribed from reminders"
      : !s.confirmed ? "Email not confirmed yet, no reminders"
      : s.reminders >= REMINDER_PLAN.length ? "All 3 reminders sent"
      : `${s.reminders} of 3 reminders sent`;
  return (
    <div className="pwrap">
      <PageHead
        title="Unfinished sign ups"
        sub="Job seekers who created an account but have not submitted their application. They get a reminder email 24 hours, 3 days and 7 days after sign up. Reminders stop when they submit."
        aside={<a className="btn btn--ghost btn--sm" href="/portal/admin/candidates">All candidates</a>}
      />
      <section className="panel" aria-labelledby="un-h">
        <header className="panel__head"><h2 id="un-h">Not submitted yet</h2><span className="pill">{list.length}</span></header>
        {list.length === 0 ? <Empty title="Everyone who signed up has submitted their application" /> : (
          <div className="tscroll">
            <table className="ntable ntable--left">
              <thead><tr><th scope="col">Name</th><th scope="col">Registered</th><th scope="col">Last reminder</th><th scope="col">Reminders</th></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td><a className="rows__title" href={`/portal/admin/candidates/${s.id}`}>{s.name || s.email}</a><br /><span className="soft small">{s.email}</span></td>
                    <td className="small nowrap"><LocalTime iso={s.createdAt} /></td>
                    <td className="small nowrap">{s.lastReminderAt ? <LocalTime iso={s.lastReminderAt} /> : "None yet"}</td>
                    <td className="small">{status(s)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
