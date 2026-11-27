import { supabaseAdmin } from "@/lib/supabase/admin";
import { validUnsubscribe, type EmailList } from "@/lib/email/links";
import { SITE } from "@/lib/email/layout";

// Turns off an email list. GET is the link in the email; POST is the one click button email apps show.
// No list in the link = weekly job alerts (older emails); list=reminders = the unfinished profile reminders.
async function stop(req: Request): Promise<{ ok: boolean; list: EmailList }> {
  const u = new URL(req.url);
  const list: EmailList = u.searchParams.get("list") === "reminders" ? "reminders" : "alerts";
  const uid = u.searchParams.get("u") ?? "", t = u.searchParams.get("t") ?? "";
  if (!validUnsubscribe(uid, t, list)) return { ok: false, list };
  await supabaseAdmin().from("seeker_profiles").update(list === "alerts" ? { job_alerts: false } : { signup_reminders_off: true }).eq("user_id", uid);
  return { ok: true, list };
}

const TEXT = {
  alerts: { title: "Job alerts", done: "Job alerts are off", line: "You will not get weekly job alerts any more. You can turn them back on any time in Settings.", fail: "Log in and turn job alerts off in Settings instead.", button: "Open Settings", href: "/portal/settings" },
  reminders: { title: "Profile reminders", done: "Reminders are off", line: "We will not send you any more reminders about finishing your profile. You can still finish it any time.", fail: "Please reply to the reminder email and we will turn them off for you.", button: "Open my profile", href: "/portal/profile" },
};

const page = ({ ok, list }: { ok: boolean; list: EmailList }) => {
  const t = TEXT[list];
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${t.title}</title></head>
<body style="margin:0;background:#F6F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#24104A">
<main style="max-width:480px;margin:12vh auto;padding:32px 28px;background:#fff;border:1px solid #E4E0EE;border-radius:16px">
<h1 style="margin:0 0 12px;font-size:24px">${ok ? t.done : "This link did not work"}</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 20px">${ok ? t.line : t.fail}</p>
<a href="${SITE}${t.href}" style="display:inline-block;padding:12px 20px;background:#0B7F77;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">${t.button}</a>
</main></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
};

export async function GET(req: Request) { return page(await stop(req)); }
export async function POST(req: Request) { return new Response(null, { status: (await stop(req)).ok ? 200 : 400 }); }
