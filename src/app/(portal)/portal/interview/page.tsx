import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { freeSlots, getInterviewSettings } from "@/lib/interviews";
import { PageHead, Empty } from "@/components/portal/Dash";
import { SlotPicker } from "@/components/portal/SlotPicker";

export const metadata: Metadata = { title: "Your interview", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function InterviewPage() {
  const { user, profile } = await getSession();
  if (!user || !profile) return null;
  if (profile.role !== "job_seeker") redirect("/portal");
  const { data: iv } = await supabaseAdmin().from("interviews").select("id, status, starts_at, meeting_link").eq("seeker_id", user.id).in("status", ["invited", "booked"]).maybeSingle();
  if (!iv) {
    return (
      <div className="pwrap pwrap--narrow">
        <PageHead title="Your interview" />
        <section className="panel"><Empty title="No interview to book right now">When our team shortlists you, we email you a link to pick a time. It opens this page.</Empty></section>
      </div>
    );
  }
  const set = await getInterviewSettings();
  const slots = await freeSlots(set);
  return (
    <div className="pwrap pwrap--narrow">
      <PageHead title="Your interview" sub={iv.status === "booked" ? "Your interview is booked. You can move it to another time below." : "Pick a time for a short video interview with our team. Times show in your own time zone."} />
      <SlotPicker slots={slots} minutes={set.slot_minutes} booked={iv.status === "booked" ? iv.starts_at : null} link={iv.status === "booked" ? iv.meeting_link : null} />
    </div>
  );
}
