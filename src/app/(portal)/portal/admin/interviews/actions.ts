"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validTz } from "@/lib/interviews";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use a time like 09:00.");
const schema = z.object({
  active: z.boolean(), auto_invite: z.boolean(),
  meeting_link: z.string().trim().max(500).url("Paste the full meeting link, starting with https://").or(z.literal("")).transform((v) => v || null),
  time_zone: z.string().refine((v) => !!validTz(v), "Choose a time zone."),
  days: z.array(z.number().int().min(0).max(6)).min(1, "Choose at least one day."),
  start_time: hhmm, end_time: hhmm,
  slot_minutes: z.coerce.number().int().min(10).max(180),
  notice_hours: z.coerce.number().int().min(0).max(336),
  days_ahead: z.coerce.number().int().min(1).max(60),
  blocked_dates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(120),
}).refine((v) => v.start_time < v.end_time, { message: "The end time must be after the start time.", path: ["end_time"] })
  .refine((v) => !v.active || !!v.meeting_link, { message: "Add the meeting link before you turn booking on.", path: ["meeting_link"] });

export async function saveInterviewSettings(input: unknown): Promise<{ ok: boolean; message?: string }> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const { data: me } = await sb.from("profiles").select("role, status").eq("id", user.id).single();
  if (me?.role !== "admin" || me.status !== "active") return { ok: false, message: "Only the RemoteCore team can do this." };
  const p = schema.safeParse(input);
  if (!p.success) return { ok: false, message: p.error.issues[0]?.message ?? "Please check the form." };
  const { error } = await supabaseAdmin().from("interview_settings").update({ ...p.data, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) return { ok: false, message: "We could not save. Please try again." };
  await supabaseAdmin().from("admin_log").insert({ actor_id: user.id, action: "interview_settings", target: "interview_settings", details: { active: p.data.active } });
  revalidatePath("/portal/admin/interviews");
  return { ok: true };
}

// Cancels a booked consultation call, so its time opens again. The team tells the business by email.
export async function cancelConsultation(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  const { data: me } = await sb.from("profiles").select("role, status").eq("id", user.id).single();
  if (me?.role !== "admin" || me.status !== "active") return;
  await supabaseAdmin().from("consultation_bookings").update({ status: "cancelled" }).eq("id", id).eq("status", "booked");
  await supabaseAdmin().from("admin_log").insert({ actor_id: user.id, action: "consultation_cancelled", target: id, details: {} });
  revalidatePath("/portal/admin/interviews");
}
