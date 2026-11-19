"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveSetting, resetSetting, setInboxStatus, replyToCompany, type SettingKey } from "@/app/(portal)/portal/admin/site-actions";
import type { CompanyInfo, Announcement, Proof } from "@/lib/settings";
import type { MainService, MoreService } from "@/lib/content";

type Msg = { ok: boolean; text: string } | null;

function useSave(key: SettingKey) {
  const router = useRouter();
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  const save = (value: unknown) => start(async () => {
    setMsg(null);
    const r = await saveSetting(key, value);
    setMsg(r.ok ? { ok: true, text: "Saved. It is on the website now." } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) router.refresh();
  });
  const reset = () => start(async () => {
    if (!confirm("Go back to the original text? Your changes here are removed.")) return;
    const r = await resetSetting(key);
    setMsg(r.ok ? { ok: true, text: "Back to the original text." } : { ok: false, text: r.message ?? "Please try again." });
    if (r.ok) location.reload();
  });
  return { msg, pending, save, reset };
}

function Bar({ msg, pending, onReset, label = "Save" }: { msg: Msg; pending: boolean; onReset?: () => void; label?: string }) {
  return (
    <div className="psec__foot">
      {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
      {onReset && <button type="button" className="linkbtn small" disabled={pending} onClick={onReset}>Reset to original</button>}
      <button className="btn btn--main btn--sm" disabled={pending}>{pending ? "Saving..." : label}</button>
    </div>
  );
}

export function CompanyEditor({ initial }: { initial: CompanyInfo }) {
  const { msg, pending, save } = useSave("company");
  const [v, setV] = useState({ phone: initial.phone, email: initial.email, address: initial.address.join("\n"), socials: initial.socials });
  const setSocial = (i: number, k: "label" | "href", val: string) => setV({ ...v, socials: v.socials.map((s, j) => (j === i ? { ...s, [k]: val } : s)) });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save({ ...v, address: v.address.split("\n").map((l) => l.trim()) }); }}>
      <div className="psec__body pgrid">
        <label className="field"><span>Phone</span><input value={v.phone} onChange={(e) => setV({ ...v, phone: e.target.value })} maxLength={40} placeholder="+1 555 000 0000" /></label>
        <label className="field"><span>Public email</span><input type="email" value={v.email} onChange={(e) => setV({ ...v, email: e.target.value })} maxLength={200} placeholder="info@remotecoreoutsourcing.com" /></label>
        <label className="field field--wide"><span>Address, one line per row</span><textarea rows={3} value={v.address} onChange={(e) => setV({ ...v, address: e.target.value })} /></label>
        <fieldset className="field field--wide">
          <legend>Social links</legend>
          <div className="srows">
            {v.socials.map((s, i) => (
              <div key={i} className="srow">
                <input aria-label="Name" value={s.label} onChange={(e) => setSocial(i, "label", e.target.value)} maxLength={40} placeholder="LinkedIn" />
                <input aria-label="Link" value={s.href} onChange={(e) => setSocial(i, "href", e.target.value)} maxLength={300} placeholder="https://" />
                <button type="button" className="linkbtn small" onClick={() => setV({ ...v, socials: v.socials.filter((_, j) => j !== i) })}>Remove</button>
              </div>
            ))}
          </div>
          {v.socials.length < 8 && <button type="button" className="btn btn--ghost btn--sm" onClick={() => setV({ ...v, socials: [...v.socials, { label: "", href: "" }] })}>Add a link</button>}
        </fieldset>
      </div>
      <Bar msg={msg} pending={pending} />
    </form>
  );
}

export function AnnouncementEditor({ initial }: { initial: Announcement }) {
  const { msg, pending, save } = useSave("announcement");
  const [v, setV] = useState(initial);
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(v); }}>
      <div className="psec__body pgrid">
        <label className="field field--wide"><span>Message</span><input value={v.text} onChange={(e) => setV({ ...v, text: e.target.value })} maxLength={220} placeholder="For example: We are hiring medical billing specialists this month." /></label>
        <label className="field"><span>Link <em className="hint">optional</em></span><input value={v.link} onChange={(e) => setV({ ...v, link: e.target.value })} maxLength={300} placeholder="/find-opportunities" /></label>
        <label className="field"><span>Link text <em className="hint">optional</em></span><input value={v.linkLabel} onChange={(e) => setV({ ...v, linkLabel: e.target.value })} maxLength={40} placeholder="See the jobs" /></label>
        <label className="chip-check field--wide"><input type="checkbox" checked={v.active} onChange={(e) => setV({ ...v, active: e.target.checked })} /> Show the banner at the top of every page</label>
      </div>
      <Bar msg={msg} pending={pending} />
    </form>
  );
}

export function FaqEditor({ initial }: { initial: [string, string][] }) {
  const { msg, pending, save, reset } = useSave("faq");
  const [items, setItems] = useState(initial);
  const set = (i: number, k: 0 | 1, val: string) => setItems(items.map((it, j) => (j === i ? (k === 0 ? [val, it[1]] : [it[0], val]) : it)));
  const move = (i: number, d: number) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; setItems(n); };
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(items); }}>
      <ol className="psec__body sedit">
        {items.map(([q, a], i) => (
          <li key={i} className="sedit__item">
            <label className="field"><span>Question {i + 1}</span><input value={q} onChange={(e) => set(i, 0, e.target.value)} maxLength={200} /></label>
            <label className="field"><span>Answer</span><textarea rows={3} value={a} onChange={(e) => set(i, 1, e.target.value)} maxLength={2000} /></label>
            <div className="aact__row">
              <button type="button" className="btn btn--ghost btn--sm" disabled={i === 0} onClick={() => move(i, -1)}>Up</button>
              <button type="button" className="btn btn--ghost btn--sm" disabled={i === items.length - 1} onClick={() => move(i, 1)}>Down</button>
              <button type="button" className="linkbtn small" onClick={() => setItems(items.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </li>
        ))}
      </ol>
      <div className="psec__body"><button type="button" className="btn btn--ghost btn--sm" disabled={items.length >= 40} onClick={() => setItems([...items, ["", ""]])}>Add a question</button></div>
      <Bar msg={msg} pending={pending} onReset={reset} />
    </form>
  );
}

const ICON_LABEL: Record<string, string> = { health: "Healthcare", support: "Support", assist: "Assistant", sales: "Sales", tech: "Technology", money: "Finance", plan: "Planning", home: "Real estate" };

export function ServicesEditor({ initial, icons }: { initial: { main: MainService[]; more: MoreService[] }; icons: string[] }) {
  const { msg, pending, save, reset } = useSave("services");
  const [main, setMain] = useState(initial.main.map((m) => ({ ...m, itemsText: m.items.join("\n"), note: m.note ?? "" })));
  const [more, setMore] = useState(initial.more);
  const icon = (val: string, on: (v: string) => void) => (
    <label className="field"><span>Icon</span><select value={val} onChange={(e) => on(e.target.value)}>{icons.map((i) => <option key={i} value={i}>{ICON_LABEL[i] ?? i}</option>)}</select></label>
  );
  const submit = () => save({
    main: main.map(({ itemsText, note, ...m }) => ({ ...m, items: itemsText.split("\n").map((l) => l.trim()), ...(note.trim() ? { note } : {}) })),
    more,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="psec__intro">The large cards on the Our Services page.</div>
      <ol className="psec__body sedit">
        {main.map((m, i) => {
          const up = (k: string, val: string) => setMain(main.map((x, j) => (j === i ? { ...x, [k]: val } : x)));
          return (
            <li key={i} className="sedit__item pgrid">
              <label className="field"><span>Service name</span><input value={m.name} onChange={(e) => up("name", e.target.value)} maxLength={80} /></label>
              {icon(m.icon, (val) => up("icon", val))}
              <label className="field field--wide"><span>Heading</span><input value={m.title} onChange={(e) => up("title", e.target.value)} maxLength={140} /></label>
              <label className="field field--wide"><span>Tasks, one per line</span><textarea rows={5} value={m.itemsText} onChange={(e) => up("itemsText", e.target.value)} /></label>
              <label className="field field--wide"><span>Small note <em className="hint">optional</em></span><input value={m.note} onChange={(e) => up("note", e.target.value)} maxLength={400} /></label>
              <div className="aact__row field--wide"><button type="button" className="linkbtn small" onClick={() => setMain(main.filter((_, j) => j !== i))}>Remove this service</button></div>
            </li>
          );
        })}
      </ol>
      <div className="psec__body"><button type="button" className="btn btn--ghost btn--sm" disabled={main.length >= 8} onClick={() => setMain([...main, { icon: icons[0], name: "", title: "", items: [], itemsText: "", note: "" }])}>Add a service</button></div>
      <div className="psec__intro">The smaller cards under &ldquo;More roles we recruit for&rdquo;.</div>
      <ol className="psec__body sedit">
        {more.map((m, i) => {
          const up = (k: string, val: string) => setMore(more.map((x, j) => (j === i ? { ...x, [k]: val } : x)));
          return (
            <li key={i} className="sedit__item pgrid">
              <label className="field"><span>Role</span><input value={m.name} onChange={(e) => up("name", e.target.value)} maxLength={80} /></label>
              {icon(m.icon, (val) => up("icon", val))}
              <label className="field field--wide"><span>Description</span><textarea rows={2} value={m.text} onChange={(e) => up("text", e.target.value)} maxLength={300} /></label>
              <div className="aact__row field--wide"><button type="button" className="linkbtn small" onClick={() => setMore(more.filter((_, j) => j !== i))}>Remove</button></div>
            </li>
          );
        })}
      </ol>
      <div className="psec__body"><button type="button" className="btn btn--ghost btn--sm" disabled={more.length >= 12} onClick={() => setMore([...more, { icon: icons[0], name: "", text: "" }])}>Add a role</button></div>
      <Bar msg={msg} pending={pending} onReset={reset} />
    </form>
  );
}

export function HeroEditor({ pages, initial }: { pages: { key: string; label: string; path: string; title: string; lede?: string }[]; initial: Record<string, { title?: string; lede?: string }> }) {
  const { msg, pending, save, reset } = useSave("heroes");
  const [v, setV] = useState<Record<string, { title: string; lede: string }>>(
    Object.fromEntries(pages.map((p) => [p.key, { title: initial[p.key]?.title ?? "", lede: initial[p.key]?.lede ?? "" }])),
  );
  const submit = () => save(Object.fromEntries(Object.entries(v).filter(([, x]) => x.title.trim() || x.lede.trim())));
  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }}>
      <div className="psec__intro">Leave a box empty to keep the original text shown in grey.</div>
      <ol className="psec__body sedit">
        {pages.map((p) => (
          <li key={p.key} className="sedit__item">
            <p className="sedit__page"><b>{p.label}</b> <a className="small" href={p.path} target="_blank" rel="noopener noreferrer">Open page</a></p>
            <label className="field"><span>Heading</span><input value={v[p.key].title} onChange={(e) => setV({ ...v, [p.key]: { ...v[p.key], title: e.target.value } })} maxLength={140} placeholder={p.title} /></label>
            {p.lede !== undefined && <label className="field"><span>Intro</span><textarea rows={2} value={v[p.key].lede} onChange={(e) => setV({ ...v, [p.key]: { ...v[p.key], lede: e.target.value } })} maxLength={600} placeholder={p.lede} /></label>}
          </li>
        ))}
      </ol>
      <Bar msg={msg} pending={pending} onReset={reset} />
    </form>
  );
}

// One inbox item: status and a private note.
export function InboxControls({ kind, id, status, note }: { kind: "request" | "form"; id: string; status: string; note: string | null }) {
  const router = useRouter();
  const [v, setV] = useState({ status, note: note ?? "" });
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form className="aact" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await setInboxStatus(kind, id, v.status, v.note); setMsg(r.ok ? { ok: true, text: "Saved." } : { ok: false, text: r.message ?? "Please try again." }); if (r.ok) router.refresh(); }); }}>
      <div className="aact__row">
        <label className="field"><span>Status</span>
          <select value={v.status} onChange={(e) => setV({ ...v, status: e.target.value })}>
            <option value="new">New</option><option value="in_review">In progress</option><option value="closed">Done</option>
          </select>
        </label>
        <label className="field"><span>Team note</span><input value={v.note} onChange={(e) => setV({ ...v, note: e.target.value })} maxLength={2000} placeholder="Only the team sees this" /></label>
        <button className="btn btn--ghost btn--sm" disabled={pending}>{pending ? "Saving..." : "Save"}</button>
      </div>
      {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
    </form>
  );
}

export function ReplyForm({ companyId }: { companyId: string }) {
  const router = useRouter();
  const [v, setV] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const [pending, start] = useTransition();
  return (
    <form className="mcompose" onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await replyToCompany(companyId, v); setMsg(r.ok ? { ok: true, text: "Sent. We emailed them too." } : { ok: false, text: r.message ?? "Please try again." }); if (r.ok) { setV(""); router.refresh(); } }); }}>
      <label className="field field--wide"><span>Your reply</span><textarea rows={4} maxLength={4000} value={v} onChange={(e) => setV(e.target.value)} required /></label>
      <div className="mcompose__foot">
        {msg && <span className={msg.ok ? "saved" : "ferr"} role={msg.ok ? "status" : "alert"}>{msg.text}</span>}
        <button className="btn btn--main btn--sm" disabled={pending || v.trim().length < 2}>{pending ? "Sending..." : "Send reply"}</button>
      </div>
    </form>
  );
}

// Homepage testimonials and numbers. Only real client words and real numbers: the section stays hidden while both lists are empty.
export function ProofEditor({ initial }: { initial: Proof }) {
  const { msg, pending, save, reset } = useSave("proof");
  const [v, setV] = useState(initial);
  const setQ = (i: number, k: "quote" | "name" | "role", val: string) => setV({ ...v, quotes: v.quotes.map((q, j) => (j === i ? { ...q, [k]: val } : q)) });
  const setS = (i: number, k: "value" | "label", val: string) => setV({ ...v, stats: v.stats.map((s, j) => (j === i ? { ...s, [k]: val } : s)) });
  return (
    <form onSubmit={(e) => { e.preventDefault(); save(v); }}>
      <div className="psec__body pgrid">
        <label className="field field--wide"><span>Section heading</span><input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} maxLength={120} /></label>
      </div>
      <ol className="psec__body sedit">
        {v.stats.map((s, i) => (
          <li key={`s${i}`} className="sedit__item">
            <div className="pgrid">
              <label className="field"><span>Number {i + 1}</span><input value={s.value} onChange={(e) => setS(i, "value", e.target.value)} maxLength={20} placeholder="120+" /></label>
              <label className="field"><span>What it counts</span><input value={s.label} onChange={(e) => setS(i, "label", e.target.value)} maxLength={80} placeholder="Professionals placed" /></label>
            </div>
            <div className="aact__row"><button type="button" className="linkbtn small" onClick={() => setV({ ...v, stats: v.stats.filter((_, j) => j !== i) })}>Remove</button></div>
          </li>
        ))}
        {v.quotes.map((q, i) => (
          <li key={`q${i}`} className="sedit__item">
            <label className="field"><span>Testimonial {i + 1}, in the client&apos;s own words</span><textarea rows={3} value={q.quote} onChange={(e) => setQ(i, "quote", e.target.value)} maxLength={600} /></label>
            <div className="pgrid">
              <label className="field"><span>Name</span><input value={q.name} onChange={(e) => setQ(i, "name", e.target.value)} maxLength={80} placeholder="Jane D." /></label>
              <label className="field"><span>Role and company <em className="hint">optional</em></span><input value={q.role} onChange={(e) => setQ(i, "role", e.target.value)} maxLength={120} placeholder="Practice Manager, Bright Dental" /></label>
            </div>
            <div className="aact__row"><button type="button" className="linkbtn small" onClick={() => setV({ ...v, quotes: v.quotes.filter((_, j) => j !== i) })}>Remove</button></div>
          </li>
        ))}
      </ol>
      <div className="psec__body aact__row">
        <button type="button" className="btn btn--ghost btn--sm" disabled={v.stats.length >= 4} onClick={() => setV({ ...v, stats: [...v.stats, { value: "", label: "" }] })}>Add a number</button>
        <button type="button" className="btn btn--ghost btn--sm" disabled={v.quotes.length >= 6} onClick={() => setV({ ...v, quotes: [...v.quotes, { quote: "", name: "", role: "" }] })}>Add a testimonial</button>
      </div>
      <Bar msg={msg} pending={pending} onReset={reset} />
    </form>
  );
}
