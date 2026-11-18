import "server-only";
import { getSession } from "@/lib/supabase/server";

// The signed in admin, for admin only pages. owner = may manage the team and delete accounts.
export async function getAdmin() {
  const s = await getSession();
  const ok = !!s.user && s.profile?.role === "admin" && s.profile?.status === "active";
  return { ...s, admin: ok, owner: ok && s.profile?.admin_level === "owner" };
}

export const ACCOUNT_STATUS: Record<string, { label: string; tone: "good" | "bad" | "neutral" | "info"; help: string }> = {
  active: { label: "Active", tone: "good", help: "Can log in and use the portal." },
  suspended: { label: "Suspended", tone: "info", help: "Paused for now. Cannot log in until you reactivate the account." },
  deactivated: { label: "Deactivated", tone: "bad", help: "Closed. Cannot log in. The data stays until you delete the account." },
};

export const ROLE_LABEL: Record<string, string> = { job_seeker: "Job seeker", employer: "Employer", admin: "RemoteCore team" };
export const LEVEL_LABEL: Record<string, string> = { owner: "Owner", staff: "Staff" };

// What each admin action is called in the activity log.
export const LOG_LABEL: Record<string, string> = {
  account_status: "Changed account status", company_status: "Changed company status", admin_level: "Changed team access",
  team_added: "Added to the team", account_deleted: "Deleted an account",
};
