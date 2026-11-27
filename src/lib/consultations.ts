import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, adminEmails } from "@/lib/email/send";
import { consultationBooked, consultationBookedAdmin } from "@/lib/email/templates";
import { freeSlots, getInterviewSettings, icsFile, validTz, whenText } from "@/lib/interviews";

// Consultation calls booked from /book-consultation (Kemar's doc, 2026-11-26).
// They use the team's open hours and meeting link from Admin > Interviews, so a time can only be taken once.

export async function consultationSlots() {
  const set = await getInterviewSettings();
  return { slots: set.active ? await freeSlots(set) : [], minutes: set.slot_minutes, active: set.active };
}

export type Booked = { id: string; startsAt: string; endsAt: string; link: string | null; teamWhen: string; visitorWhen: string };

// Reserves the time before the form is saved. Returns null when the time is no longer free.
export async function reserveConsultation(slotIso: string, visitorTz: string | null, who: { company: string; name: string; email: string; talent: string }): Promise<Booked | "taken" | "off"> {
  const set = await getInterviewSettings();
  if (!set.active) return "off";
  const start = new Date(slotIso);
  if (isNaN(start.getTime())) return "taken";
  const slots = await freeSlots(set);
  if (!slots.includes(start.toISOString())) return "taken";
  const end = new Date(start.getTime() + set.slot_minutes * 60000);
  const { data, error } = await supabaseAdmin().from("consultation_bookings").insert({
    starts_at: start.toISOString(), ends_at: end.toISOString(), meeting_link: set.meeting_link,
    company: who.company.slice(0, 200), contact_name: who.name.slice(0, 200), email: who.email.slice(0, 200), talent_type: who.talent.slice(0, 200),
  }).select("id").single();
  if (error || !data) return "taken";
  const tz = validTz(visitorTz) ?? set.time_zone;
  return { id: data.id, startsAt: start.toISOString(), endsAt: end.toISOString(), link: set.meeting_link, teamWhen: whenText(start.toISOString(), set.time_zone), visitorWhen: whenText(start.toISOString(), tz) };
}

export async function linkConsultation(bookingId: string, submissionId: string) {
  await supabaseAdmin().from("consultation_bookings").update({ submission_id: submissionId }).eq("id", bookingId);
}

export async function releaseConsultation(bookingId: string) {
  await supabaseAdmin().from("consultation_bookings").delete().eq("id", bookingId);
}

// The visitor and the team each get the time and a calendar file.
export async function notifyConsultationBooked(b: Booked, who: { company: string; name: string; email: string; talent: string }, ref: string) {
  const ics = icsFile({
    id: `consult-${b.id}`, start: b.startsAt, end: b.endsAt, link: b.link, alarm: "Consultation in 30 minutes",
    title: `RemoteCore consultation${who.company ? `: ${who.company}` : ""}`,
    description: `Free consultation with RemoteCore Outsourcing.${b.link ? ` Join: ${b.link}` : ""}`,
  });
  const attachments = [{ filename: "consultation.ics", content: ics }];
  const team = adminEmails();
  await Promise.allSettled([
    sendEmail({ to: who.email, ...consultationBooked({ name: who.name, when: b.visitorWhen, link: b.link, ref }), attachments }),
    team.length ? sendEmail({ to: team, replyTo: who.email, ...consultationBookedAdmin({ ...who, when: b.teamWhen, ref }), attachments }) : null,
  ]);
}
