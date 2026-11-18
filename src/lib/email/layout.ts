// One simple, email safe design for every message: white card on a pale page, purple heading, teal button.
// Inline styles only, because most email apps ignore style sheets.

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
export { esc };

export const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://remotecoreoutsourcing.com";

const ACCOUNT_FOOTER = `You get this email because you have an account on <a href="${SITE}" style="color:#8A84A0">remotecoreoutsourcing.com</a>.`;

export function layout({ preview, heading, paragraphs, button, note, footer }: {
  preview: string; heading: string; paragraphs: string[]; button?: { label: string; href: string }; note?: string; footer?: string;
}) {
  // paragraphs and note may hold simple trusted markup (<b>); every value from a user is escaped by the caller.
  const p = paragraphs.map((t) => `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#24104A">${t}</p>`).join("");
  const btn = button ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px"><tr><td style="border-radius:10px;background:#0B7F77"><a href="${button.href}" style="display:inline-block;padding:14px 24px;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${button.label}</a></td></tr></table>` : "";
  const nt = note ? `<p style="margin:0;font-size:13.5px;line-height:1.55;color:#5B5571">${note}</p>` : "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading}</title></head>
<body style="margin:0;padding:0;background:#F6F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preview.replace(/<[^>]+>/g, ""))}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F4FA;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px">
<tr><td style="padding:0 4px 18px;font-size:18px;font-weight:800;color:#24104A;letter-spacing:-0.3px">RemoteCore <span style="color:#0B7F77;font-weight:700">Outsourcing</span></td></tr>
<tr><td style="background:#ffffff;border-radius:16px;padding:32px 28px;border:1px solid #E4E0EE">
<h1 style="margin:0 0 18px;font-size:24px;line-height:1.25;color:#24104A">${heading}</h1>${p}${btn}${nt}
</td></tr>
<tr><td style="padding:18px 4px 0;font-size:12.5px;line-height:1.6;color:#8A84A0">RemoteCore Outsourcing LLC · 816 William S Canning Blvd #1036, Fall River, MA 02721, United States<br>${footer ?? ACCOUNT_FOOTER}</td></tr>
</table></td></tr></table></body></html>`;
}

export function textVersion(heading: string, paragraphs: string[], button?: { label: string; href: string }, note?: string) {
  const strip = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  return [heading, "", ...paragraphs.map(strip).flatMap((x) => [x, ""]), button ? `${button.label}: ${button.href}\n` : "", note ? strip(note) : "", "", "RemoteCore Outsourcing LLC"].join("\n");
}
