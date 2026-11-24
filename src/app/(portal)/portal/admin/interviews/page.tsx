import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin } from "@/lib/portal/admin";
import { getInterviewSettings, freeSlots } from "@/lib/interviews";
import { PageHead, Empty } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { InterviewSettingsForm } from "@/components/portal/InterviewSettingsForm";
import { InterviewButtons } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Interviews", robots: { index: false } };
export const dynamic = "force-dynamic";

type Iv = { id: string; seeker_id: string; status: string; starts_at: string | null; invited_at: string; profiles: { full_name: string; email: string } | null; applications: { jobs: { title: string } | null } | null };

export default async function AdminInterviews() {
  const { sb, admin } = await getAdmin();
  if (!admin) notFound();
  const [set, list] = await Promise.all([
    getInterviewSettings(),
    sb.from("interviews").select("id, seeker_id, status, starts_at, invited_at, profiles!interviews_seeker_id_fkey(full_name, email), applications(jobs(title))").in("status", ["invited", "booked"]).order("starts_at", { ascending: true, nullsFirst: false }).limit(300),
  ]);
  const open = (await freeSlots(set)).length;
  const rows = (list.data ?? []) as unknown as Iv[];
  const booked = rows.filter((r) => r.status === "booked");
  const waiting = rows.filter((r) => r.status === "invited");
  const Row = ({ r }: { r: Iv }) => (
    <li>
      <div className="crows__who">
        <a className="rows__title" href={`/portal/admin/candidates/${r.seeker_id}`}>{r.profiles?.full_name || r.profiles?.email || "Candidate"}</a>
        <span className="soft small">{r.applications?.jobs?.title ?? "General application"}</span>
      </div>
      <span className="small nowrap">{r.starts_at ? <LocalTime iso={r.starts_at} /> : <>Invited <LocalTime iso={r.invited_at} /></>}</span>
      <InterviewButtons seekerId={r.seeker_id} interviewId={r.id} status={r.status} />
    </li>
  );
  return (
    <div className="pwrap">
      <PageHead title="Interviews" sub="Shortlisted candidates pick a time from your open hours. Both of you get a calendar file, and they get a reminder the day before." />
      <section className="panel" aria-labelledby="up-h">
        <header className="panel__head"><h2 id="up-h">Coming up</h2><span className="pill">{booked.length}</span></header>
        {booked.length === 0 ? <Empty title="No interviews booked yet" /> : <ul className="rows crows">{booked.map((r) => <Row key={r.id} r={r} />)}</ul>}
      </section>
      <section className="panel" aria-labelledby="wait-h">
        <header className="panel__head"><h2 id="wait-h">Invited, no time picked yet</h2><span className="pill">{waiting.length}</span></header>
        {waiting.length === 0 ? <Empty title="Nobody is waiting" /> : <ul className="rows crows">{waiting.map((r) => <Row key={r.id} r={r} />)}</ul>}
      </section>
      <section className="panel" aria-labelledby="set-h">
        <header className="panel__head"><h2 id="set-h">Your open hours</h2><span className={`pill ${set.active ? "pill--good" : ""}`}>{set.active ? `On, ${open} open times` : "Off"}</span></header>
        <InterviewSettingsForm initial={set} />
      </section>
    </div>
  );
}
