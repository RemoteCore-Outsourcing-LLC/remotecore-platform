import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "@/lib/email/send";
import { formAdmin, formReceived } from "@/lib/email/templates";

// Every public form posts here. Each kind lists its required fields.
const KINDS: Record<string, { required: string[]; consent?: string[] }> = {
  consultation: { required: ["company", "contact_name", "email", "phone", "talent_type"], consent: ["consent"] },
  "staffing-request": { required: ["full_name", "company", "email", "industry", "roles", "hires", "responsibilities"], consent: ["consent"] },
  candidate: { required: ["full_name", "email", "country", "category"], consent: ["consent"] },
  contact: { required: ["full_name", "email", "inquiry_type", "message"], consent: ["consent"] },
  introduction: { required: ["company", "contact_name", "email", "job_title", "profile_ids", "requirements"], consent: ["consent"] },
  "career-session": { required: ["full_name", "email", "service"], consent: ["consent"] },
  "learning-notify": { required: ["email"] },
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function POST(req: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  const spec = KINDS[kind];
  if (!spec) return NextResponse.json({ error: "Unknown form." }, { status: 404 });

  let data: FormData;
  try {
    data = await req.formData();
  } catch {
    return NextResponse.json({ error: "Please try again." }, { status: 400 });
  }

  // Bots fill the hidden field. Answer as if it worked and keep nothing.
  if (String(data.get("company_site") || "").trim()) return NextResponse.json({ ok: true });

  // Only plain field names, a limited number of them, and limited length.
  const entry: Record<string, string> = {};
  for (const [k, v] of data.entries()) {
    if (typeof v !== "string" || k === "company_site" || !/^[a-z][a-z0-9_]{0,39}$/.test(k)) continue;
    if (Object.keys(entry).length >= 30) break;
    entry[k] = v.trim().slice(0, 4000);
  }
  for (const f of spec.required) {
    if (!entry[f]) return NextResponse.json({ error: "Please fill in every required field." }, { status: 400 });
  }
  for (const f of spec.consent ?? []) {
    if (entry[f] !== "yes") return NextResponse.json({ error: "Please tick the consent box." }, { status: 400 });
  }
  if (entry.email && !EMAIL.test(entry.email)) {
    return NextResponse.json({ error: "Please check your email address." }, { status: 400 });
  }

  // Limits: 8 forms an hour from one visitor, 3 an hour for one email address. Over that we answer as if it worked
  // and send nothing, so the form can not be used to send mail to strangers.
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const ipHash = createHash("sha256").update(`${process.env.EMAIL_LINK_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const db = supabaseAdmin();
  const [byIp, byEmail] = await Promise.all([
    db.from("form_submissions").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
    entry.email ? db.from("form_submissions").select("id", { count: "exact", head: true }).eq("email", entry.email.toLowerCase()).gte("created_at", hourAgo) : Promise.resolve({ count: 0 }),
  ]);
  if ((byIp.count ?? 0) >= 8) return NextResponse.json({ error: "You sent several forms in a short time. Please wait an hour and try again." }, { status: 429 });
  if ((byEmail.count ?? 0) >= 3) return NextResponse.json({ ok: true });
  if (entry.email) entry.email = entry.email.toLowerCase();

  const { data: saved, error } = await db.from("form_submissions").insert({ kind, email: entry.email ?? null, data: entry, ip_hash: ipHash }).select("id").single();
  if (error || !saved) {
    console.error("[form] save failed", kind, error?.message);
    return NextResponse.json({ error: "We could not send this right now. Please try again in a minute." }, { status: 500 });
  }
  // Alert the team (reply goes to the visitor) and send the visitor a short receipt. Email problems never fail the form.
  const ref = saved.id.slice(0, 8).toUpperCase();
  const mails: Promise<unknown>[] = [];
  const team = adminEmails();
  if (team.length) mails.push(sendEmail({ to: team, replyTo: entry.email, ...formAdmin(kind, entry, ref) }));
  const receipt = entry.email ? formReceived(kind, entry, ref) : null;
  if (receipt) mails.push(sendEmail({ to: entry.email, ...receipt }));
  await Promise.allSettled(mails);

  return NextResponse.json({ ok: true });
}
