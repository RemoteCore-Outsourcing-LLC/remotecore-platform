import { supabaseAdmin } from "@/lib/supabase/admin";
import { validUnsubscribe } from "@/lib/email/links";
import { SITE } from "@/lib/email/layout";

// Turns off weekly job alerts. GET is the link in the email; POST is the one click button email apps show.
async function stop(req: Request) {
  const u = new URL(req.url);
  const uid = u.searchParams.get("u") ?? "", t = u.searchParams.get("t") ?? "";
  if (!validUnsubscribe(uid, t)) return false;
  await supabaseAdmin().from("seeker_profiles").update({ job_alerts: false }).eq("user_id", uid);
  return true;
}

const page = (ok: boolean) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Job alerts</title></head>
<body style="margin:0;background:#F6F4FA;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#24104A">
<main style="max-width:480px;margin:12vh auto;padding:32px 28px;background:#fff;border:1px solid #E4E0EE;border-radius:16px">
<h1 style="margin:0 0 12px;font-size:24px">${ok ? "Job alerts are off" : "This link did not work"}</h1>
<p style="font-size:16px;line-height:1.6;margin:0 0 20px">${ok ? "You will not get weekly job alerts any more. You can turn them back on any time in Settings." : "Log in and turn job alerts off in Settings instead."}</p>
<a href="${SITE}/portal/settings" style="display:inline-block;padding:12px 20px;background:#0B7F77;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Open Settings</a>
</main></body></html>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });

export async function GET(req: Request) { return page(await stop(req)); }
export async function POST(req: Request) { return new Response(null, { status: (await stop(req)) ? 200 : 400 }); }
