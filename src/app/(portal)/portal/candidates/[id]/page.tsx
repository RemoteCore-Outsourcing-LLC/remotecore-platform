import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { candidateDetail } from "@/lib/portal/candidates";
import { APP_STATUS } from "@/lib/portal/seeker";
import { CandidateProfile } from "@/components/portal/CandidateProfile";
import { StatusPill, StatusTrack } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";
import { StatusControl, FileButton, VoicePlayer } from "@/components/portal/CandidateClient";

export const metadata: Metadata = { title: "Candidate", robots: { index: false } };

export default async function Candidate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const c = await candidateDetail(sb, company.id, id);
  if (!c) notFound();
  return (
    <div className="pwrap">
      <p className="crumb"><a href={`/portal/candidates?job=${c.job.id}`}>Candidates for {c.job.title}</a></p>
      <div className="cand">
        <div className="cand__main">
          <article className="jobdoc">
            <header className="jobdoc__head">
              <div className="cand__title">
                {c.photo && <img className="cand__photo" src={c.photo} alt={`Photo of ${c.name}`} width={72} height={72} />}
                <h1>{c.name}</h1>
                <StatusPill status={c.status} />
              </div>
              {c.profile?.headline && <p className="cand__headline">{c.profile.headline}</p>}
              <p className="soft small">{[c.country, `Applied to ${c.job.title}`].filter(Boolean).join(" · ")} · <LocalTime iso={c.created_at} /></p>
            </header>
            <div className="jobdoc__body">
              <CandidateProfile c={c} requirements={c.job.computer_requirements} />
            </div>
          </article>
        </div>

        <aside className="cand__side" aria-label="Decision and files">
          <section className="panel cside">
            <header className="panel__head"><h2>Where this stands</h2></header>
            <div className="cside__body">
              <StatusTrack status={c.status} />
              <StatusControl appId={c.id} status={c.status} />
              <p className="soft small">The candidate gets an email each time you change the status.</p>
              {c.hist.length > 0 && (
                <details className="app__hist">
                  <summary>History</summary>
                  <ol>{c.hist.map((h, i) => <li key={i}><span>{APP_STATUS[h.to_status]?.label ?? h.to_status}</span><span className="soft"><LocalTime iso={h.changed_at} /></span></li>)}</ol>
                </details>
              )}
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Resume and voice intro</h2></header>
            <div className="cside__body">
              {c.hasResume ? <FileButton appId={c.id} kind="resume" label="Open resume" /> : <p className="soft small">No resume on file.</p>}
              {c.documents.map((d, i) => <FileButton key={i} appId={c.id} kind="document" index={i} label={d} />)}
              {c.hasAudio ? <VoicePlayer appId={c.id} /> : <p className="soft small">No voice intro yet.</p>}
              <p className="soft small">Files open through a private link that stops working after 5 minutes.</p>
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Next step</h2></header>
            <div className="cside__body">
              <p className="soft small">Want to interview this candidate, or have a question about them? Send RemoteCore a message.</p>
              <a className="btn btn--ghost btn--sm" href={`/portal/messages?about=${c.id}`}>Message RemoteCore</a>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

