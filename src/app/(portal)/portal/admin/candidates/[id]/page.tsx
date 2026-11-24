import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdmin, ACCOUNT_STATUS, LISTING_STATUS } from "@/lib/portal/admin";
import { loadSeeker, fileLabel } from "@/lib/portal/candidates";
import { listingCode } from "@/lib/marketplace";
import { profileProgress } from "@/lib/portal/seeker";
import { LocalTime } from "@/components/portal/DashClient";
import { CandidateProfile } from "@/components/portal/CandidateProfile";
import { SeekerFileButton, SeekerVoice, TagEditor, NoteForm, DeleteNoteButton, ListingButtons, AdminAppStatus, StageButtons, InterviewButtons } from "@/components/portal/AdminClient";

export const metadata: Metadata = { title: "Candidate", robots: { index: false } };

type App = { id: string; status: string; created_at: string; note: string | null; extra_documents: string[]; jobs: { id: string; title: string; companies: { name: string } | null } | null };
type NoteRow = { id: string; body: string; created_at: string; profiles: { full_name: string; email: string } | null };

export default async function AdminCandidate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { sb, admin } = await getAdmin();
  if (!admin || !/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { data: person } = await sb.from("profiles").select("id, role, status, full_name, email, phone, country, created_at").eq("id", id).maybeSingle();
  if (!person || person.role !== "job_seeker") notFound();

  const [s, extra, progress, apps, tagRows, allTags, notes, ivs] = await Promise.all([
    loadSeeker(sb, id),
    sb.from("seeker_profiles").select("stage, submitted_at, linkedin, marketplace_consent, marketplace_consent_at, marketplace_status, marketplace_changed_at, preferred_categories").eq("user_id", id).maybeSingle(),
    profileProgress(sb, id, person),
    sb.from("applications").select("id, status, created_at, note, extra_documents, jobs(id, title, companies(name))").eq("seeker_id", id).order("created_at", { ascending: false }),
    sb.from("candidate_tags").select("tag").eq("seeker_id", id).order("tag"),
    sb.from("candidate_tags").select("tag").limit(1000),
    sb.from("candidate_notes").select("id, body, created_at, profiles!candidate_notes_author_id_fkey(full_name, email)").eq("seeker_id", id).order("created_at", { ascending: false }),
    sb.from("interviews").select("id, status, starts_at, invited_at").eq("seeker_id", id).order("created_at", { ascending: false }).limit(5),
  ]);
  const interviews = (ivs.data ?? []) as { id: string; status: string; starts_at: string | null; invited_at: string }[];
  const openIv = interviews.find((v) => v.status === "invited" || v.status === "booked") ?? null;
  const IV_LABEL: Record<string, string> = { invited: "Invited, no time picked yet", booked: "Booked", cancelled: "Cancelled", done: "Done", no_show: "Did not show up" };
  const p = s.sp.data;
  const x = extra.data;
  const data = {
    profile: p, computer: s.pc.data, work: s.work.data ?? [], education: s.edu.data ?? [], certs: s.certs.data ?? [],
    skills: (s.skills.data ?? []).map((r) => r.skill as string), languages: s.langs.data ?? [],
  };
  const tags = (tagRows.data ?? []).map((r) => r.tag as string);
  const known = Array.from(new Set((allTags.data ?? []).map((r) => r.tag as string))).sort();
  const applications = (apps.data ?? []) as unknown as App[];
  const noteList = (notes.data ?? []) as unknown as NoteRow[];
  const listing = x?.marketplace_status ?? "hidden";
  const acct = ACCOUNT_STATUS[person.status];

  return (
    <div className="pwrap">
      <p className="crumb"><a href="/portal/admin/candidates">All candidates</a></p>
      <div className="cand">
        <div className="cand__main stack">
          <article className="jobdoc">
            <header className="jobdoc__head">
              <div className="cand__title">
                <h1>{person.full_name || person.email}</h1>
                {person.status !== "active" && <span className={`pill pill--${acct.tone}`}>{acct.label}</span>}
                {tags.map((t) => <span key={t} className="pill pill--info">{t}</span>)}
              </div>
              {p?.headline && <p className="cand__headline">{p.headline}</p>}
              <p className="soft small">{[person.country, `Joined`].filter(Boolean).join(" · ")} <LocalTime iso={person.created_at} /> · Profile {progress.count} of {progress.total} sections done</p>
            </header>
            <div className="jobdoc__body">
              <section aria-labelledby="contact-h">
                <h2 id="contact-h">Contact</h2>
                <dl className="facts">
                  <dt>Email</dt><dd><a href={`mailto:${person.email}`}>{person.email}</a></dd>
                  {person.phone && <><dt>Phone</dt><dd>{person.phone}</dd></>}
                  {x?.linkedin && <><dt>LinkedIn</dt><dd><a href={x.linkedin} target="_blank" rel="noopener noreferrer">{x.linkedin.replace(/^https?:\/\/(www\.)?/, "")}</a></dd></>}
                  {x?.preferred_categories?.length ? <><dt>Wants to work in</dt><dd>{x.preferred_categories.join(", ")}</dd></> : null}
                </dl>
              </section>
              <CandidateProfile c={data} />
              <section aria-labelledby="apps-h">
                <h2 id="apps-h">Applications</h2>
                {applications.length === 0 ? <p className="soft">No applications yet.</p> : (
                  <ul className="alist">
                    {applications.map((a) => (
                      <li key={a.id}>
                        <span className="alist__main">
                          <b>{a.jobs?.title ?? "Job removed"}</b>
                          <span className="soft small">{a.jobs?.companies?.name ?? "Posted by RemoteCore"} · <LocalTime iso={a.created_at} /></span>
                          {a.note && <span className="small prose">{a.note}</span>}
                          {a.extra_documents?.length > 0 && (
                            <span className="alist__files">{a.extra_documents.map((d, i) => <SeekerFileButton key={i} seekerId={id} kind="document" appId={a.id} index={i} label={fileLabel(d)} />)}</span>
                          )}
                        </span>
                        <AdminAppStatus appId={a.id} status={a.status} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </article>
        </div>

        <aside className="cand__side" aria-label="Files, tags and notes">
          <section className="panel cside">
            <header className="panel__head"><h2>Stage</h2>{x?.submitted_at ? <span className="pill pill--good">Application submitted</span> : <span className="pill">Not submitted yet</span>}</header>
            <div className="cside__body">
              <p className="soft small">Your team&apos;s own stage for this person, with or without a job. Shortlisted sends them a link to pick an interview time.</p>
              <StageButtons seekerId={id} stage={x?.stage ?? "new"} />
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Interview</h2></header>
            <div className="cside__body">
              {interviews.length === 0 ? <p className="soft small">No interview yet.</p> : (
                <ul className="anotes">
                  {interviews.map((v) => (
                    <li key={v.id}>
                      <b className="small">{IV_LABEL[v.status] ?? v.status}</b>
                      <span className="soft small">{v.starts_at ? <LocalTime iso={v.starts_at} /> : <>Invited <LocalTime iso={v.invited_at} /></>}</span>
                    </li>
                  ))}
                </ul>
              )}
              <InterviewButtons seekerId={id} interviewId={openIv?.id} status={openIv?.status} />
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Resume and voice intro</h2></header>
            <div className="cside__body">
              {p?.resume_path ? <SeekerFileButton seekerId={id} kind="resume" label="Open resume" /> : <p className="soft small">No resume yet.</p>}
              {p?.audio_path ? <SeekerVoice seekerId={id} /> : <p className="soft small">No voice intro yet.</p>}
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Tags</h2></header>
            <div className="cside__body"><TagEditor seekerId={id} tags={tags} known={known} /></div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Talent Marketplace</h2><span className={`pill pill--${LISTING_STATUS[listing]?.tone ?? "neutral"}`}>{LISTING_STATUS[listing]?.label ?? listing}</span></header>
            <div className="cside__body">
              <p className="soft small">
                {x?.marketplace_consent
                  ? <>Agreed to be listed{x.marketplace_consent_at ? <> on <LocalTime iso={x.marketplace_consent_at} /></> : null}. Public card {listingCode(id)} shows their first name, last initial, headline, summary, skills and experience. Never their contact details or files.</>
                  : "Has not agreed to be listed. Only they can turn it on, in their settings."}
              </p>
              <ListingButtons seekerId={id} status={listing} consent={!!x?.marketplace_consent} />
            </div>
          </section>
          <section className="panel cside">
            <header className="panel__head"><h2>Team notes</h2></header>
            <div className="cside__body">
              {noteList.length > 0 && (
                <ol className="anotes">
                  {noteList.map((n) => (
                    <li key={n.id}>
                      <p className="prose small">{n.body}</p>
                      <span className="soft small">{n.profiles?.full_name || n.profiles?.email || "Former team member"} · <LocalTime iso={n.created_at} /> · <DeleteNoteButton noteId={n.id} seekerId={id} /></span>
                    </li>
                  ))}
                </ol>
              )}
              <NoteForm seekerId={id} />
            </div>
          </section>
          <p className="soft small"><a href={`/portal/admin/users/${id}`}>Account settings</a> for suspending or deleting this login.</p>
        </aside>
      </div>
    </div>
  );
}
