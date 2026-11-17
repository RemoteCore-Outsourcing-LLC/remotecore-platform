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

  const entry: Record<string, string> = {};
  for (const [k, v] of data.entries()) {
    if (typeof v === "string" && k !== "company_site") entry[k] = v.trim().slice(0, 4000);
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

  const { data: saved, error } = await supabaseAdmin().from("form_submissions").insert({ kind, email: entry.email ?? null, data: entry }).select("id").single();
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
