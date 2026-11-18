import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEmployer } from "@/lib/portal/employer";
import { candidateDetail, EMPLOYMENT } from "@/lib/portal/candidates";
import { APP_STATUS, money, shortDate } from "@/lib/portal/seeker";
import { StatusPill, StatusTrack } from "@/components/portal/Dash";
import { LocalTime } from "@/components/portal/DashClient";
import { NotApproved } from "@/components/portal/EmployerGate";
import { StatusControl, FileButton, VoicePlayer } from "@/components/portal/CandidateClient";

export const metadata: Metadata = { title: "Candidate", robots: { index: false } };

const LEVEL: Record<string, string> = { basic: "Basic", conversational: "Conversational", fluent: "Fluent", native: "Native" };
const yes = (v: boolean | null | undefined) => (v == null ? null : v ? "Yes" : "No");
const span = (a: string | number | null | undefined, b: string | number | null | undefined, now = "Now") =>
  [a, b].some((x) => x != null && x !== "") ? `${a ?? "?"} to ${b ?? now}` : null;
const month = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" }) : null);

export default async function Candidate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, user, company } = await getEmployer();
  if (!user) return null;
  if (!company) redirect("/portal");
  if (company.status !== "approved") return <NotApproved status={company.status} />;
  const c = await candidateDetail(sb, company.id, id);
  if (!c) notFound();
  const p = c.profile;
  const pc = c.computer;

  const specs: [string, string | null][] = pc ? [
    ["Computer", pc.computer_type ? pc.computer_type[0].toUpperCase() + pc.computer_type.slice(1) : null],
    ["System", pc.operating_system], ["Processor", pc.processor], ["Memory", pc.ram], ["Storage", pc.storage],
    ["Internet", pc.connection_type],
    ["Speed", pc.download_mbps != null || pc.upload_mbps != null ? `${pc.download_mbps ?? "?"} Mbps down, ${pc.upload_mbps ?? "?"} Mbps up` : null],
    ["Webcam", yes(pc.has_webcam)], ["Microphone", yes(pc.has_microphone)], ["Other equipment", pc.other_equipment],
  ] : [];
  const shownSpecs = specs.filter(([, v]) => v);
  const prefs: [string, string | null][] = [
    ["Experience", p?.years_experience != null ? `${p.years_experience} ${p.years_experience === 1 ? "year" : "years"}` : null],
    ["Looking for", p?.employment_types?.length ? p.employment_types.map((t: string) => EMPLOYMENT[t] ?? t).join(", ") : null],
    ["Expected pay", p?.expected_salary ? `${money(Number(p.expected_salary), p.salary_currency || "USD")} a month` : null],
    ["Hours", p?.preferred_hours ?? null], ["Time zone", p?.time_zone ?? null],
    ["Available from", p?.available_from ? shortDate(p.available_from) : null],
  ];
  const shownPrefs = prefs.filter(([, v]) => v);

  return (
    <div className="pwrap">
      <p className="crumb"><a href={`/portal/candidates?job=${c.job.id}`}>Candidates for {c.job.title}</a></p>
      <div className="cand">
        <div className="cand__main">
          <article className="jobdoc">
            <header className="jobdoc__head">
              <div className="cand__title">
                <h1>{c.name}</h1>
                <StatusPill status={c.status} />
              </div>
              {p?.headline && <p className="cand__headline">{p.headline}</p>}
              <p className="soft small">{[c.country, `Applied to ${c.job.title}`].filter(Boolean).join(" · ")} · <LocalTime iso={c.created_at} /></p>
            </header>
            <div className="jobdoc__body">
              {c.note && (
                <section aria-labelledby="note-h">
                  <h2 id="note-h">Message from the candidate</h2>
                  <p className="prose cand__note">{c.note}</p>
                </section>
              )}
              {p?.summary && (
                <section aria-labelledby="about-h">
                  <h2 id="about-h">About</h2>
                  <p className="prose">{p.summary}</p>
                </section>
              )}
              {shownPrefs.length > 0 && (
                <section aria-labelledby="prefs-h">
                  <h2 id="prefs-h">Experience and availability</h2>
                  <dl className="facts">{shownPrefs.map(([k, v]) => <Fact key={k} k={k} v={v!} />)}</dl>
                </section>
              )}
              <section aria-labelledby="pc-h">
                <h2 id="pc-h">Computer and internet</h2>
                {c.job.computer_requirements && <p className="cand__req small"><b>Your job asks for:</b> {c.job.computer_requirements}</p>}
                {shownSpecs.length ? <dl className="facts">{shownSpecs.map(([k, v]) => <Fact key={k} k={k} v={v!} />)}</dl> : <p className="soft">The candidate has not added their computer details yet.</p>}
              </section>
              <section aria-labelledby="work-h">
                <h2 id="work-h">Work history</h2>
                {c.work.length ? (
                  <ol className="tl">
                    {c.work.map((w, i) => (
                      <li key={i}>
                        <span><b>{w.title}</b><span className="soft"> at {w.company}</span></span>
                        {span(month(w.start_date), month(w.end_date)) && <span className="soft small tl__when">{span(month(w.start_date), month(w.end_date))}</span>}
                        {w.description && <p className="prose small">{w.description}</p>}
                      </li>
                    ))}
                  </ol>
                ) : <p className="soft">No work history added.</p>}
              </section>
              <section aria-labelledby="edu-h">
                <h2 id="edu-h">Education and qualifications</h2>
                {c.education.length === 0 && c.certs.length === 0 && !p?.qualifications ? <p className="soft">No education or qualifications added.</p> : (
                  <div className="stack">
                    {c.education.length > 0 && (
                      <ol className="tl">
                        {c.education.map((e, i) => (
                          <li key={i}>
                            <span><b>{[e.degree, e.field].filter(Boolean).join(", ") || e.school}</b>
                            {(e.degree || e.field) && <span className="soft"> at {e.school}</span>}</span>
                            {span(e.start_year, e.end_year) && <span className="soft small tl__when">{span(e.start_year, e.end_year)}</span>}
                          </li>
                        ))}
                      </ol>
                    )}
                    {c.certs.length > 0 && (
                      <ul className="chips">{c.certs.map((x, i) => <li key={i} className="pill">{[x.name, x.issuer, x.year].filter(Boolean).join(", ")}</li>)}</ul>
                    )}
                    {p?.qualifications && <p className="prose">{p.qualifications}</p>}
                  </div>
                )}
              </section>
              <section aria-labelledby="skills-h">
                <h2 id="skills-h">Skills and languages</h2>
                {c.skills.length === 0 && c.languages.length === 0 ? <p className="soft">No skills added.</p> : (
                  <div className="stack">
                    {c.skills.length > 0 && <ul className="chips">{c.skills.map((s) => <li key={s} className="pill">{s}</li>)}</ul>}
                    {c.languages.length > 0 && <p className="small">{c.languages.map((l) => `${l.language} (${LEVEL[l.level] ?? l.level})`).join(" · ")}</p>}
                  </div>
                )}
              </section>
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

function Fact({ k, v }: { k: string; v: string }) {
  return <><dt>{k}</dt><dd>{v}</dd></>;
}
