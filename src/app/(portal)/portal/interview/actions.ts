"use server";
import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { freeSlots, getInterviewSettings, notifyInterviewBooked } from "@/lib/interviews";

type Result = { ok: boolean; message?: string };

// The job seeker books (or moves) their interview to one of the open times.
export async function bookInterview(startIso: string): Promise<Result> {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, message: "Please log in again." };
  const db = supabaseAdmin();
  const { data: iv } = await db.from("interviews").select("id, status, starts_at").eq("seeker_id", user.id).in("status", ["invited", "booked"]).maybeSingle();
  if (!iv) return { ok: false, message: "You do not have an interview invite right now." };
  const set = await getInterviewSettings();
  const slots = await freeSlots(set);
  const start = new Date(startIso);
  if (isNaN(start.getTime()) || !slots.includes(start.toISOString())) return { ok: false, message: "That time was just taken. Please pick another one." };
  const end = new Date(start.getTime() + set.slot_minutes * 60000);
  const { error } = await db.from("interviews").update({
    status: "booked", starts_at: start.toISOString(), ends_at: end.toISOString(), booked_at: new Date().toISOString(),
    reminded_at: null, meeting_link: set.meeting_link,
  }).eq("id", iv.id);
  if (error) return { ok: false, message: error.code === "23505" ? "That time was just taken. Please pick another one." : "We could not book this time. Please try again." };
  await db.from("seeker_profiles").update({ stage: "interview" }).eq("user_id", user.id).in("stage", ["new", "shortlisted"]);
  await notifyInterviewBooked(iv.id);
  revalidatePath("/portal", "layout");
  return { ok: true };
}
