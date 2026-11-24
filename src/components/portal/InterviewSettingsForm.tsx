"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveInterviewSettings } from "@/app/(portal)/portal/admin/interviews/actions";
import type { InterviewSettings } from "@/lib/interviews";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function InterviewSettingsForm({ initial }: { initial: InterviewSettings }) {
  const router = useRouter();
  const [v, setV] = useState({ ...initial, meeting_link: initial.meeting_link ?? "", start_time: initial.start_time.slice(0, 5), end_time: initial.end_time.slice(0, 5), blocked: initial.blocked_dates.join("\n") });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const zones = useMemo(() => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : [v.time_zone]), [v.time_zone]);
  const save = () => start(async () => {
    setMsg(null);
    const { blocked, ...rest } = v;
    const r = await saveInterviewSettings({ ...rest, blocked_dates: blocked.split(/[\s,]+/).filter(Boolean) });
    setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) router.refresh();
  });
  return (
    <form className="psec__body stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <label className="chip-check"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Interview booking is on</label>
      <label className="chip-check"><input type="checkbox" checked={v.auto_invite} onChange={(e) => setV({ ...v, auto_invite: e.target.checked })} /> Send the booking email by itself when someone is shortlisted</label>
      <div className="pgrid">
        <label className="field field--wide"><span>Meeting link</span><input type="url" value={v.meeting_link} onChange={(e) => setV({ ...v, meeting_link: e.target.value })} placeholder="Your Zoom or Google Meet link" /><em className="hint">The same link goes to every candidate. Use your Zoom personal room or a Google Meet link.</em></label>
        <label className="field"><span>Your time zone</span><select value={v.time_zone} onChange={(e) => setV({ ...v, time_zone: e.target.value })}>{zones.map((z) => <option key={z}>{z}</option>)}</select></label>
        <label className="field"><span>Each interview takes (minutes)</span><input type="number" min={10} max={180} step={5} value={v.slot_minutes} onChange={(e) => setV({ ...v, slot_minutes: Number(e.target.value) })} /></label>
        <label className="field"><span>From</span><input type="time" value={v.start_time} onChange={(e) => setV({ ...v, start_time: e.target.value })} /></label>
        <label className="field"><span>Until</span><input type="time" value={v.end_time} onChange={(e) => setV({ ...v, end_time: e.target.value })} /></label>
        <label className="field"><span>Shortest notice (hours)</span><input type="number" min={0} max={336} value={v.notice_hours} onChange={(e) => setV({ ...v, notice_hours: Number(e.target.value) })} /></label>
        <label className="field"><span>Show times for the next (days)</span><input type="number" min={1} max={60} value={v.days_ahead} onChange={(e) => setV({ ...v, days_ahead: Number(e.target.value) })} /></label>
        <fieldset className="field field--wide"><legend>Days you interview</legend>
          <div className="chips">{DAYS.map((d, i) => <label key={d} className="chip-check"><input type="checkbox" checked={v.days.includes(i)} onChange={() => setV({ ...v, days: v.days.includes(i) ? v.days.filter((x) => x !== i) : [...v.days, i].sort() })} />{d}</label>)}</div>
        </fieldset>
        <label className="field field--wide"><span>Days off</span><textarea rows={2} value={v.blocked} onChange={(e) => setV({ ...v, blocked: e.target.value })} placeholder="2026-12-25" /><em className="hint">One date per line, like 2026-12-25. No interviews are offered on these days.</em></label>
      </div>
      <div className="aact__row">
        <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : "Save open hours"}</button>
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
      </div>
    </form>
  );
}
