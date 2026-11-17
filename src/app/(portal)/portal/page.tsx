import { redirect } from "next/navigation";
import { getSession } from "@/lib/supabase/server";

// Each role has its own home. The job seeker dashboard comes in the next step; until then the profile is home.
export default async function PortalHome() {
  const { profile } = await getSession();
  if (profile?.role === "job_seeker") redirect("/portal/profile");
  redirect("/portal/profile");
}
