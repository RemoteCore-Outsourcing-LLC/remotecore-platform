"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { SETTINGS_TAG } from "@/lib/settings";
import { HERO_PAGES } from "@/lib/heroes";
import { SERVICE_ICONS } from "@/lib/content";
import { notifyTeamReply } from "@/lib/email/notify";

type Result = { ok: boolean; message?: string };
const UUID = /^[0-9a-f-]{36}$/i;

async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: me } = await sb.from("profiles").select("id, role, status").eq("id", user.id).single();
  if (!me || me.role !== "admin" || me.status !== "active") return null;
  return { sb, me };
}
const log = (actorId: string, action: string, target: string, details: Record<string, unknown>) =>
  supabaseAdmin().from("admin_log").insert({ actor_id: actorId, action, target, details });

const text = (max: number) => z.string().trim().max(max);
const url = z.string().trim().max(300).refine((v) => v === "" || /^(https?:\/\/[^\s/]|\/(?![\/\\])|mailto:|tel:)/.test(v), "Start the link with https://, or / for a page on this site.");
const SCHEMAS = {
  company: z.object({
    phone: text(40), email: z.string().trim().max(200).refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "Enter a valid email."),
    address: z.array(text(120)).max(5).transform((a) => a.filter(Boolean)),
    socials: z.array(z.object({ label: text(40).min(1), href: url })).max(8),
  }),
  announcement: z.object({ active: z.boolean(), text: text(220), link: url, linkLabel: text(40) })
    .refine((a) => !a.active || a.text.length >= 3, "Write the announcement before turning it on."),
  faq: z.array(z.tuple([text(200).min(3, "Every question needs text."), text(2000).min(3, "Every answer needs text.")])).min(1).max(40),
  services: z.object({
    main: z.array(z.object({ icon: z.enum(SERVICE_ICONS as [string, ...string[]]), name: text(80).min(2), title: text(140).min(2), items: z.array(text(120)).max(12).transform((a) => a.filter(Boolean)), note: text(400).optional() })).max(8),
    more: z.array(z.object({ icon: z.enum(SERVICE_ICONS as [string, ...string[]]), name: text(80).min(2), text: text(300).min(2) })).max(12),
  }),
  proof: z.object({
    title: text(120).min(3, "Give the section a heading."),
    quotes: z.array(z.object({ quote: text(600).min(10, "Every testimonial needs the client's words."), name: text(80).min(2, "Every testimonial needs a name."), role: text(120) })).max(6),
    stats: z.array(z.object({ value: text(20).min(1, "Every number needs a value."), label: text(80).min(2, "Every number needs a label.") })).max(4),
  }),
  heroes: z.record(z.string(), z.object({ title: text(140), lede: text(600) }))
    .refine((h) => Object.keys(h).every((k) => k in HERO_PAGES), "Unknown page."),
};
export type SettingKey = keyof typeof SCHEMAS;

// Save one part of the website settings. The public site shows it within seconds.
export async function saveSetting(key: SettingKey, value: unknown): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const schema = SCHEMAS[key];
  if (!schema) return { ok: false, message: "Unknown setting." };
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Please check what you entered." };
  const { error } = await a.sb.from("site_settings").upsert({ key, value: parsed.data, updated_at: new Date().toISOString(), updated_by: a.me.id });
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  await log(a.me.id, "site_setting", key, {});
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Go back to the text the site was built with.
export async function resetSetting(key: SettingKey): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!(key in SCHEMAS)) return { ok: false, message: "Unknown setting." };
  await a.sb.from("site_settings").delete().eq("key", key);
  await log(a.me.id, "site_setting_reset", key, {});
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
  return { ok: true };
}

// Inbox: move a staffing request or a form to new, in review or closed, with a private note.
export async function setInboxStatus(kind: "request" | "form", id: string, status: string, note?: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  if (!UUID.test(id) || !["new", "in_review", "closed"].includes(status)) return { ok: false, message: "Something is wrong with this request." };
  const table = kind === "request" ? "staffing_requests" : "form_submissions";
  const patch: Record<string, unknown> = { status };
  if (note !== undefined) patch.note = String(note).trim().slice(0, 2000) || null;
  const { error } = await a.sb.from(table).update(patch).eq("id", id);
  if (error) return { ok: false, message: "We could not save this. Please try again." };
  await log(a.me.id, "inbox_status", id, { kind, to: status });
  revalidatePath("/portal/admin/inbox", "layout");
  revalidatePath("/portal");
  return { ok: true };
}

// Reply to an employer. They see it on their Messages page and get an email.
export async function replyToCompany(companyId: string, body: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a) return { ok: false, message: "Please log in again." };
  const msg = String(body ?? "").trim();
  if (!UUID.test(companyId) || msg.length < 2) return { ok: false, message: "Write your reply first." };
  if (msg.length > 4000) return { ok: false, message: "Please keep it under 4,000 characters." };
  const { data, error } = await a.sb.from("messages").insert({ company_id: companyId, sender_id: a.me.id, body: msg, read_at: new Date().toISOString() }).select("id").single();
  if (error || !data) return { ok: false, message: "We could not send the reply. Please try again." };
  await a.sb.from("messages").update({ read_at: new Date().toISOString() }).eq("company_id", companyId).is("read_at", null);
  await notifyTeamReply(data.id);
  await log(a.me.id, "message_reply", companyId, {});
  revalidatePath("/portal/admin/inbox", "layout");
  revalidatePath("/portal/messages");
  return { ok: true };
}

export async function markThreadRead(companyId: string): Promise<Result> {
  const a = await requireAdmin();
  if (!a || !UUID.test(companyId)) return { ok: false };
  await a.sb.from("messages").update({ read_at: new Date().toISOString() }).eq("company_id", companyId).is("read_at", null);
  revalidatePath("/portal/admin/inbox", "layout");
  return { ok: true };
}
