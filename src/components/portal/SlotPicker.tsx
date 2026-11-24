"use client";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bookInterview } from "@/app/(portal)/portal/interview/actions";

// Open interview times grouped by day, shown in the visitor's own time zone.
export function SlotPicker({ slots, minutes, booked, link }: { slots: string[]; minutes: number; booked: string | null; link: string | null }) {
  const router = useRouter();
  const [pick, setPick] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const [moving, setMoving] = useState(!booked);
  const tz = typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "";
  const days = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const s of slots) {
      const k = new Date(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return Array.from(m.entries());
  }, [slots]);
  const time = (s: string) => new Date(s).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const full = (s: string) => new Date(s).toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" });
  const book = () => pick && start(async () => {
    setMsg(null);
    const r = await bookInterview(pick);
    if (!r.ok) { setMsg({ ok: false, text: r.message ?? "Please try again." }); router.refresh(); return; }
    setMsg({ ok: true, text: "Booked. We emailed you the details and a calendar file." });
    setMoving(false); setPick(null);
    router.refresh();
  });

  return (
    <div className="stack">
      {booked && (
        <section className="panel slotdone" aria-label="Your booked interview">
          <p><span className="soft small">Booked for</span><br /><b>{full(booked)}</b> <span className="soft small">({minutes} minutes, {tz})</span></p>
          {link ? <p><a className="btn btn--main btn--sm" href={link} target="_blank" rel="noopener noreferrer">Meeting link</a></p> : <p className="soft small">We will email you the meeting link before the interview.</p>}
          <p className="soft small">Please join from the computer you would work on. We will ask you to share your screen. We email you a reminder the day before.</p>
          {!moving && <button type="button" className="linkbtn" onClick={() => setMoving(true)}>Pick another time</button>}
        </section>
      )}
      {msg && <p className={`notice ${msg.ok ? "notice--ok" : ""}`} role={msg.ok ? "status" : "alert"}>{msg.text}</p>}
      {moving && (
        <section className="panel slots" aria-label="Open times">
          {days.length === 0 ? <p className="soft">There are no open times right now. Please check again tomorrow, or reply to our email.</p> : (
            <>
              <p className="soft small">Times are in your time zone: {tz}. Each interview takes {minutes} minutes.</p>
              {days.map(([day, list]) => (
                <fieldset key={day} className="slots__day">
                  <legend>{day}</legend>
                  <div className="slots__grid">
                    {list.map((s) => (
                      <label key={s} className={`slot ${pick === s ? "is-on" : ""}`}>
                        <input type="radio" name="slot" value={s} checked={pick === s} onChange={() => setPick(s)} />
                        {time(s)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <div className="slots__go">
                <button type="button" className="btn btn--main" disabled={!pick || pending} onClick={book}>{pending ? "Booking..." : pick ? `Book ${full(pick)}` : "Pick a time first"}</button>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
