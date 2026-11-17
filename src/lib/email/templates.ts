import { layout, textVersion, esc, SITE } from "./layout";
import type { Mail } from "./send";

type Built = Omit<Mail, "to">;
function build(subject: string, preview: string, heading: string, paragraphs: string[], button?: { label: string; href: string }, note?: string): Built {
  return { subject, html: layout({ preview, heading, paragraphs, button, note }), text: textVersion(heading, paragraphs, button, note) };
}
const first = (name: string) => esc((name || "").trim().split(" ")[0] || "there");
const when = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: "America/New_York" }) + " (US Eastern time)";

// Job seeker: application received.
export function applicationReceived(a: { name: string; job: string; at: string; ref: string }) {
  return build(
    `We received your application for ${a.job}`,
    `Reference ${a.ref}. We will email you when the status changes.`,
    "Application received",
    [
      `Hi ${first(a.name)},`,
      `Your application for <b>${esc(a.job)}</b> reached us on ${when(a.at)}. Your reference is <b>${esc(a.ref)}</b>.`,
      "Our team reviews every application. If your profile is a good match, the employer may shortlist you. We will email you each time your status changes.",
    ],
    { label: "Track my application", href: `${SITE}/portal/applications` },
  );
}

const STATUS: Record<string, { heading: string; line: string }> = {
  under_review: { heading: "Your application is under review", line: "Our team is now looking at your profile and resume." },
  shortlisted: { heading: "You were shortlisted", line: "Good news. You were shortlisted for this role. We will contact you about the next steps." },
  interview_stage: { heading: "You moved to the interview stage", line: "You are now in the interview stage. Look out for a message from us with the details." },
  selected: { heading: "You were selected", line: "Congratulations. You were selected for this role. We will contact you soon about the next steps." },
  not_selected: { heading: "An update on your application", line: "Thank you for applying. This time the employer chose another candidate. Your profile stays active, so you can keep applying to other roles." },
  position_filled: { heading: "This position has been filled", line: "This position has now been filled. Thank you for your interest. Your profile stays active, so you can keep applying to other roles." },
};
export const STATUS_EMAIL = STATUS;

// Job seeker: any status change after the first one.
export function statusChanged(a: { name: string; job: string; status: string }) {
  const s = STATUS[a.status];
  if (!s) return null;
  const closed = a.status === "not_selected" || a.status === "position_filled";
  return build(
    `Update on your application for ${a.job}`,
    s.line,
    s.heading,
    [`Hi ${first(a.name)},`, `${s.line}`, `Role: <b>${esc(a.job)}</b>`],
    closed ? { label: "Browse other jobs", href: `${SITE}/portal/jobs` } : { label: "See my application", href: `${SITE}/portal/applications` },
  );
}

// RemoteCore team: a new application came in.
export function newApplicationAdmin(a: { name: string; country: string; job: string; ref: string }) {
  return build(
    `New application: ${a.name} for ${a.job}`,
    `${a.name} applied for ${a.job}.`,
    "New application",
    [`<b>${esc(a.name)}</b>${a.country ? ` from ${esc(a.country)}` : ""} applied for <b>${esc(a.job)}</b>.`, `Reference ${esc(a.ref)}.`],
    { label: "Open the dashboard", href: `${SITE}/portal` },
  );
}

// Employer: someone applied to their job.
export function newApplicationEmployer(a: { job: string }) {
  return build(
    `New applicant for ${a.job}`,
    "Review their profile, resume and voice introduction in your dashboard.",
    "You have a new applicant",
    [`A new candidate applied for <b>${esc(a.job)}</b>.`, "Review their profile, resume and voice introduction in your dashboard."],
    { label: "Review applicants", href: `${SITE}/portal` },
  );
}

// Supabase sends these two itself (through Resend). The {{ .ConfirmationURL }} tag is filled in by Supabase.
export const authConfirm = build(
  "Confirm your email for RemoteCore",
  "One click and your account is ready.",
  "Confirm your email",
  ["Thanks for joining RemoteCore Outsourcing.", "Click the button to confirm your email and finish setting up your profile."],
  { label: "Confirm my email", href: "{{ .ConfirmationURL }}" },
  "This link works for 1 hour. If you did not sign up, you can ignore this email.",
);
export const authRecovery = build(
  "Reset your RemoteCore password",
  "Choose a new password with the link inside.",
  "Reset your password",
  ["We got a request to reset the password for your RemoteCore account.", "Click the button to choose a new one."],
  { label: "Choose a new password", href: "{{ .ConfirmationURL }}" },
  "This link works for 1 hour. If you did not ask for this, ignore this email and your password stays the same.",
);
