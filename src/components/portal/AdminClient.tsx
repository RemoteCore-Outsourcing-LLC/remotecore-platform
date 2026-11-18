"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setAccountStatus, setCompanyStatus, setAdminLevel, addTeamMember, deleteAccount } from "@/app/(portal)/portal/admin/actions";

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
  return { msg, pending, run };
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
