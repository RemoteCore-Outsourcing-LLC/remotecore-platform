"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAccountStatus, setCompanyStatus, setAdminLevel, addTeamMember, deleteAccount } from "@/app/(portal)/portal/admin/actions";
import { reviewJob, adminSetJobStatus, removeJob, adminSetApplicationStatus, addCategory, renameCategory, moveCategory, deleteCategory } from "@/app/(portal)/portal/admin/job-actions";
import { APP_STATUS } from "@/lib/portal/seeker";
import { openSeekerFile, addTag, removeTag, addNote, deleteNote, setListing } from "@/app/(portal)/portal/admin/candidate-actions";

type Msg = { ok: boolean; text: string } | null;
type Res = { ok: boolean; message?: string; id?: string };

function useAction() {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<Res>, okText: string, after?: (r: Res) => void) => start(async () => {
    setMsg(null);
    const r = await fn();
    if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); return; }
    setMsg({ ok: true, text: okText });
    if (after) after(r); else router.refresh();
  });
  return { msg, pending, run, router };
}

const Note = ({ msg }: { msg: Msg }) => (msg ? <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span> : null);

// Reactivate, suspend or deactivate a login.
export function AccountStatusButtons({ userId, status }: { userId: string; status: string }) {
  const { msg, pending, run } = useAction();
  const go = (s: string, text: string) => run(() => setAccountStatus(userId, s), text);
  return (
    <div className="aact">
      <div className="aact__row">
        {status !== "active" && <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => go("active", "Account reactivated. They can log in again.")}>Reactivate</button>}
        {status === "active" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go("suspended", "Account suspended. They are logged out and cannot log in.")}>Suspend</button>}
        {status !== "deactivated" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go("deactivated", "Account deactivated.")}>Deactivate</button>}
      </div>
      <Note msg={msg} />
    </div>
  );
}

// Approve, suspend or reopen a company account.
export function CompanyStatusButtons({ companyId, status }: { companyId: string; status: string }) {
  const { msg, pending, run } = useAction();
  return (
    <div className="aact">
      <div className="aact__row">
        {status !== "approved" && (
          <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => run(() => setCompanyStatus(companyId, "approved"), "Company approved. We emailed them.")}>
            {status === "suspended" ? "Reopen company" : "Approve company"}
          </button>
        )}
        {status === "approved" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => run(() => setCompanyStatus(companyId, "suspended"), "Company suspended. They cannot post jobs or see candidates now. Live jobs stay live until you pause them.")}>Suspend company</button>}
      </div>
      <Note msg={msg} />
    </div>
  );
}

export function AdminLevelSelect({ userId, level }: { userId: string; level: string }) {
  const { msg, pending, run } = useAction();
  const [value, setValue] = useState(level);
  return (
    <form className="aact" onSubmit={(e) => { e.preventDefault(); run(() => setAdminLevel(userId, value), "Access saved."); }}>
      <div className="aact__row">
        <label className="field"><span>Access</span>
          <select value={value} onChange={(e) => setValue(e.target.value)} disabled={pending}>
            <option value="staff">Staff: day to day work</option>
            <option value="owner">Owner: also the team and deleting accounts</option>
          </select>
        </label>
        <button className="btn btn--ghost btn--sm" disabled={pending || value === level}>Save</button>
      </div>
      <Note msg={msg} />
    </form>
  );
}

export function DeleteAccountBox({ userId, what }: { userId: string; what: string }) {
  const router = useRouter();
  const { msg, pending, run } = useAction();
  const [confirm, setConfirm] = useState("");
  return (
    <form className="aact" onSubmit={(e) => { e.preventDefault(); run(() => deleteAccount(userId, confirm), "Account deleted.", () => router.push("/portal/admin/users?deleted=1")); }}>
      <p className="soft small">This deletes {what}. It cannot be undone.</p>
      <div className="aact__row">
        <label className="field"><span>Type DELETE to confirm</span><input value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" /></label>
        <button className="btn btn--danger btn--sm" disabled={pending || confirm.trim().toUpperCase() !== "DELETE"}>{pending ? "Deleting..." : "Delete account"}</button>
      </div>
      <Note msg={msg} />
    </form>
  );
}

export function AddTeamMemberForm() {
  const { msg, pending, run } = useAction();
  const [v, setV] = useState({ name: "", email: "", level: "staff" });
  return (
    <form className="ateam" onSubmit={(e) => { e.preventDefault(); run(() => addTeamMember(v), `Added. We emailed ${v.email} so they can choose a password.`, () => setV({ name: "", email: "", level: "staff" })); }}>
      <label className="field"><span>Name</span><input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} required maxLength={120} /></label>
      <label className="field"><span>Email</span><input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} required maxLength={200} /></label>
      <label className="field"><span>Access</span>
        <select value={v.level} onChange={(e) => setV({ ...v, level: e.target.value })}>
          <option value="staff">Staff</option>
          <option value="owner">Owner</option>
        </select>
      </label>
      <div className="ateam__foot">
        <Note msg={msg} />
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Adding..." : "Add to the team"}</button>
      </div>
    </form>
  );
}

// Opens a private file in a new tab through a fresh 5 minute link.
export function SeekerFileButton({ seekerId, kind, appId, index = 0, label }: { seekerId: string; kind: "resume" | "document"; appId?: string; index?: number; label: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const open = () => {
    const tab = window.open("", "_blank");
    start(async () => {
      setErr("");
      const r = await openSeekerFile(seekerId, kind, appId, index);
      if (r.ok && r.url) { if (tab) tab.location.href = r.url; else location.href = r.url; return; }
      tab?.close();
      setErr(r.message ?? "Please try again.");
    });
  };
  return (
    <span className="cfile">
      <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={open}>
        <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7zM14 3v5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        {pending ? "Opening..." : label}
      </button>
      {err && <span className="ferr" role="alert">{err}</span>}
    </span>
  );
}

export function SeekerVoice({ seekerId }: { seekerId: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [src, setSrc] = useState("");
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const load = () => start(async () => {
    setErr("");
    const r = await openSeekerFile(seekerId, "audio");
    if (!r.ok || !r.url) { setErr(r.message ?? "Please try again."); return; }
    setSrc(r.url);
    requestAnimationFrame(() => ref.current?.play().catch(() => {}));
  });
  return (
    <div className="cvoice">
      {src ? <audio ref={ref} className="maudio" controls src={src} preload="auto" /> : (
        <button type="button" className="btn btn--soft btn--sm" disabled={pending} onClick={load}>
          <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          {pending ? "Loading..." : "Play voice intro"}
        </button>
      )}
      {err && <span className="ferr" role="alert">{err}</span>}
    </div>
  );
}

// Tags group candidates (for example "Medical billing" or "Spanish speaker"). Suggestions come from tags already in use.
export function TagEditor({ seekerId, tags, known }: { seekerId: string; tags: string[]; known: string[] }) {
  const { msg, pending, run, router } = useAction();
  const [v, setV] = useState("");
  const listId = `tags-${seekerId}`;
  return (
    <div className="aact">
      {tags.length > 0 ? (
        <ul className="chips">
          {tags.map((t) => (
            <li key={t} className="taginput__tag">{t}
              <button type="button" aria-label={`Remove tag ${t}`} disabled={pending} onClick={() => run(() => removeTag(seekerId, t), "Tag removed.")}>×</button>
            </li>
          ))}
        </ul>
      ) : <p className="soft small">No tags yet.</p>}
      <form className="aact__row" onSubmit={(e) => { e.preventDefault(); const t = v; run(() => addTag(seekerId, t), "Tag added.", () => { setV(""); router.refresh(); }); }}>
        <label className="field"><span>Add a tag</span><input list={listId} value={v} onChange={(e) => setV(e.target.value)} maxLength={40} /></label>
        <datalist id={listId}>{known.filter((k) => !tags.includes(k)).map((k) => <option key={k} value={k} />)}</datalist>
        <button className="btn btn--ghost btn--sm" disabled={pending || !v.trim()}>Add</button>
      </form>
      <Note msg={msg} />
    </div>
  );
}

export function NoteForm({ seekerId }: { seekerId: string }) {
  const { msg, pending, run, router } = useAction();
  const [v, setV] = useState("");
  return (
    <form className="aact" onSubmit={(e) => { e.preventDefault(); const t = v; run(() => addNote(seekerId, t), "Note saved.", () => { setV(""); router.refresh(); }); }}>
      <label className="field"><span>Add a private note</span><textarea rows={3} maxLength={4000} value={v} onChange={(e) => setV(e.target.value)} placeholder="Only the RemoteCore team sees notes." /></label>
      <div className="aact__row"><button className="btn btn--ghost btn--sm" disabled={pending || v.trim().length < 2}>{pending ? "Saving..." : "Save note"}</button><Note msg={msg} /></div>
    </form>
  );
}

export function DeleteNoteButton({ noteId, seekerId }: { noteId: string; seekerId: string }) {
  const { pending, run } = useAction();
  return <button type="button" className="linkbtn small" disabled={pending} onClick={() => { if (confirm("Delete this note?")) run(() => deleteNote(noteId, seekerId), "Deleted."); }}>Delete</button>;
}

export function ListingButtons({ seekerId, status, consent }: { seekerId: string; status: string; consent: boolean }) {
  const { msg, pending, run } = useAction();
  return (
    <div className="aact">
      <div className="aact__row">
        {status !== "published" && <button type="button" className="btn btn--main btn--sm" disabled={pending || !consent} onClick={() => run(() => setListing(seekerId, true), "Listed on the Talent Marketplace.")}>Publish on the marketplace</button>}
        {status === "published" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => run(() => setListing(seekerId, false), "Taken off the marketplace.")}>Take off the marketplace</button>}
      </div>
      <Note msg={msg} />
    </div>
  );
}

// Approve an employer's job, or send it back with what to change.
export function ReviewBox({ jobId }: { jobId: string }) {
  const { msg, pending, run } = useAction();
  const [reason, setReason] = useState("");
  const [back, setBack] = useState(false);
  return (
    <div className="aact">
      <div className="aact__row">
        <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => run(() => reviewJob(jobId, true), "Approved. The job is live and we emailed the employer.")}>Approve and publish</button>
        {!back && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => setBack(true)}>Ask for changes</button>}
      </div>
      {back && (
        <form className="aact" onSubmit={(e) => { e.preventDefault(); run(() => reviewJob(jobId, false, reason), "Sent back. We emailed the employer what to change."); }}>
          <label className="field"><span>What should they change?</span><textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: please add the pay range and the working hours." /></label>
          <div className="aact__row">
            <button className="btn btn--ghost btn--sm" disabled={pending || reason.trim().length < 5}>Send back to the employer</button>
            <button type="button" className="linkbtn small" onClick={() => setBack(false)}>Cancel</button>
          </div>
        </form>
      )}
      <Note msg={msg} />
    </div>
  );
}

export function AdminJobActions({ id, status, applicants }: { id: string; status: string; applicants: number }) {
  const router = useRouter();
  const { msg, pending, run } = useAction();
  const go = (s: "published" | "paused" | "closed", text: string) => run(() => adminSetJobStatus(id, s), text);
  return (
    <div className="aact">
      <div className="aact__row">
        {(status === "paused" || status === "closed" || status === "draft") && <button type="button" className="btn btn--main btn--sm" disabled={pending} onClick={() => go("published", "The job is live.")}>Publish</button>}
        {status === "published" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => go("paused", "Paused. Job seekers cannot see it now.")}>Pause</button>}
        {status !== "closed" && <button type="button" className="btn btn--ghost btn--sm" disabled={pending} onClick={() => { if (confirm("Close this job? It stops taking applications.")) go("closed", "Closed."); }}>Close</button>}
        {applicants === 0 && <button type="button" className="btn btn--danger btn--sm" disabled={pending} onClick={() => { if (confirm("Remove this job for good?")) run(() => removeJob(id), "Removed.", () => router.push("/portal/admin/jobs?removed=1")); }}>Remove</button>}
      </div>
      {applicants > 0 && <p className="soft small">People applied, so this job can be closed but not removed.</p>}
      <Note msg={msg} />
    </div>
  );
}

// Status picker on one application, in the all applications list.
export function AdminAppStatus({ appId, status }: { appId: string; status: string }) {
  const { msg, pending, run } = useAction();
  const [v, setV] = useState(status);
  return (
    <form className="aapp" onSubmit={(e) => { e.preventDefault(); run(() => adminSetApplicationStatus(appId, v), "Saved. We emailed the candidate."); }}>
      <label className="sr-only" htmlFor={`st-${appId}`}>Status</label>
      <select id={`st-${appId}`} value={v} onChange={(e) => setV(e.target.value)} disabled={pending}>
        {Object.entries(APP_STATUS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
      </select>
      <button className="btn btn--ghost btn--sm" disabled={pending || v === status}>{pending ? "Saving..." : "Save"}</button>
      <Note msg={msg} />
    </form>
  );
}

export function CategoryRow({ id, name, jobs, first, last }: { id: number; name: string; jobs: number; first: boolean; last: boolean }) {
  const { msg, pending, run } = useAction();
  const [v, setV] = useState(name);
  return (
    <li className="acat">
      <form className="acat__name" onSubmit={(e) => { e.preventDefault(); run(() => renameCategory(id, v), "Renamed."); }}>
        <label className="sr-only" htmlFor={`cat-${id}`}>Category name</label>
        <input id={`cat-${id}`} value={v} onChange={(e) => setV(e.target.value)} maxLength={80} />
        {v.trim() !== name && <button className="btn btn--ghost btn--sm" disabled={pending}>Rename</button>}
      </form>
      <span className="soft small nowrap">{jobs} {jobs === 1 ? "job" : "jobs"}</span>
      <span className="acat__act">
        <button type="button" className="btn btn--ghost btn--sm" aria-label={`Move ${name} up`} disabled={pending || first} onClick={() => run(() => moveCategory(id, -1), "Moved.")}>Up</button>
        <button type="button" className="btn btn--ghost btn--sm" aria-label={`Move ${name} down`} disabled={pending || last} onClick={() => run(() => moveCategory(id, 1), "Moved.")}>Down</button>
        <button type="button" className="linkbtn small" disabled={pending} onClick={() => { if (confirm(`Delete the category ${name}?`)) run(() => deleteCategory(id), "Deleted."); }}>Delete</button>
      </span>
      <Note msg={msg} />
    </li>
  );
}

export function AddCategoryForm() {
  const { msg, pending, run, router } = useAction();
  const [v, setV] = useState("");
  return (
    <form className="aact__row" onSubmit={(e) => { e.preventDefault(); const n = v; run(() => addCategory(n), "Added.", () => { setV(""); router.refresh(); }); }}>
      <label className="field"><span>New category</span><input value={v} onChange={(e) => setV(e.target.value)} maxLength={80} /></label>
      <button className="btn btn--main btn--sm" disabled={pending || v.trim().length < 2}>Add</button>
      <Note msg={msg} />
    </form>
  );
}
