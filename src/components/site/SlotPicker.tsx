"use client";
import { useCallback, useEffect, useMemo, useState } from "react";

// Pick a day, then a time. Times come from the team's open hours and show in the visitor's own time zone.
// The chosen time goes to the form as "slot" (a moment in time), with the visitor's time zone as "tz".
export function SlotPicker({ initial, minutes }: { initial: string[]; minutes: number }) {
  const [slots, setSlots] = useState(initial);
  const [day, setDay] = useState<string | null>(null);
  const [pick, setPick] = useState<string | null>(null);
  const [tz, setTz] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => { setTz(Intl.DateTimeFormat().resolvedOptions().timeZone); }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/consultation-slots", { cache: "no-store" });
      const j = await r.json();
      setSlots(Array.isArray(j.slots) ? j.slots : []);
      setPick(null);
      setNote("Open times were updated. Please pick a time again.");
    } catch { /* keep the old list */ }
  }, []);
  useEffect(() => {
    window.addEventListener("slots:refresh", refresh);
    return () => window.removeEventListener("slots:refresh", refresh);
  }, [refresh]);

  // Group by the visitor's local day. Until the browser is ready the server shows days in UTC; they settle a moment later.
  const days = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots) {
      const k = new Date(s).toLocaleDateString("en-CA", tz ? { timeZone: tz } : { timeZone: "UTC" });
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return Array.from(m.entries());
  }, [slots, tz]);
  const current = days.find(([k]) => k === day) ?? days[0];
  const opt = tz ? { timeZone: tz } : { timeZone: "UTC" };
  const dayLabel = (k: string) => {
    const d = new Date(`${k}T12:00:00Z`);
    return { wd: d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }), md: d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" }) };
  };
  const time = (s: string) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", ...opt });
  const full = (s: string) => new Date(s).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", ...opt });

  if (slots.length === 0) {
    return (
      <div className="field">
        <span>Preferred day &amp; time, with your time zone <em>(optional)</em></span>
        <input name="preferred_time" maxLength={300} placeholder="For example: Tuesday or Wednesday, 10am to 1pm Eastern" />
        <em className="hint">There are no open times online right now. Tell us what suits you and we will email you to confirm.</em>
      </div>
    );
  }

  return (
    <fieldset className="slotpick">
      <legend>Pick a time for your call</legend>
      <p className="slotpick__help">Free {minutes} minute video call. Times show in your time zone{tz ? `: ${tz.replace(/_/g, " ")}` : ""}.</p>
      <div className="slotpick__days" role="group" aria-label="Day">
        {days.map(([k]) => {
          const l = dayLabel(k);
          const on = current?.[0] === k;
          return (
            <button key={k} type="button" className={`slotpick__day${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => setDay(k)}>
              <b>{l.wd}</b><span>{l.md}</span>
            </button>
          );
        })}
      </div>
      <div className="slotpick__times">
        {current?.[1].map((s) => (
          <label key={s} className={`slotpick__time${pick === s ? " is-on" : ""}`}>
            <input type="radio" name="slot" value={s} required checked={pick === s} onChange={() => { setPick(s); setNote(""); }} />
            {time(s)}
          </label>
        ))}
      </div>
      <input type="hidden" name="tz" value={tz} />
      <p className="slotpick__picked" aria-live="polite">{pick ? <>Your call: <b>{full(pick)}</b></> : note || "Pick a day, then a time."}</p>
    </fieldset>
  );
}
