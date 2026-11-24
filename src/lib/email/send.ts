import "server-only";

// Sends through Resend from the company's own domain. Never throws: an email problem must not break the action that caused it.
const FROM = process.env.EMAIL_FROM || "RemoteCore Outsourcing <noreply@remotecoreoutsourcing.com>";

export type Mail = { to: string | string[]; subject: string; html: string; text: string; replyTo?: string; headers?: Record<string, string>; attachments?: { filename: string; content: string }[] };

export async function sendEmail(m: Mail): Promise<{ ok: boolean; id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY is not set" };
  const to = (Array.isArray(m.to) ? m.to : [m.to]).filter(Boolean);
  if (!to.length) return { ok: false, error: "no recipient" };
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject: m.subject, html: m.html, text: m.text, reply_to: m.replyTo || process.env.EMAIL_REPLY_TO || undefined, headers: m.headers, attachments: m.attachments }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { console.error("email failed", r.status, j); return { ok: false, error: j?.message ?? String(r.status) }; }
    return { ok: true, id: j.id };
  } catch (e) {
    console.error("email failed", e);
    return { ok: false, error: "network" };
  }
}

// Who at RemoteCore gets the team alerts. Comma separated in the ADMIN_NOTIFY_EMAIL setting.
export const adminEmails = () => (process.env.ADMIN_NOTIFY_EMAIL || "").split(",").map((s) => s.trim()).filter(Boolean);
