import { layout, textVersion, esc, SITE } from "./layout";
import type { Mail } from "./send";

type Built = Omit<Mail, "to">;
function build(subject: string, preview: string, heading: string, paragraphs: string[], button?: { label: string; href: string }, note?: string, footer?: string): Built {
  return { subject, html: layout({ preview, heading, paragraphs, button, note, footer }), text: textVersion(heading, paragraphs, button, note) };
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

// Supabase sends these two itself (through Resend). Supabase fills in {{ .SiteURL }} and {{ .TokenHash }}; the link opens /auth/confirm, which works on any device.
export const authConfirm = build(
  "Confirm your email for RemoteCore",
  "One click and your account is ready.",
  "Confirm your email",
  ["Thanks for joining RemoteCore Outsourcing.", "Click the button to confirm your email and finish setting up your profile."],
  { label: "Confirm my email", href: "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email" },
  "This link works for 1 hour. If you did not sign up, you can ignore this email.",
);
export const authRecovery = build(
  "Reset your RemoteCore password",
  "Choose a new password with the link inside.",
  "Reset your password",
  ["We got a request to reset the password for your RemoteCore account.", "Click the button to choose a new one."],
  { label: "Choose a new password", href: "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery" },
  "This link works for 1 hour. If you did not ask for this, ignore this email and your password stays the same.",
);

// Footers for people who may not have an account yet, and for internal alerts.
const FORM_FOOTER = `You get this email because you sent a form on <a href="${SITE}" style="color:#8A84A0">remotecoreoutsourcing.com</a>.`;
const TEAM_FOOTER = "Internal alert for the RemoteCore team.";
const money = (cents: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
const day = (iso: string) => new Date(iso).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/New_York" });
const row = (label: string, value: string) => `<b>${esc(label)}:</b> ${esc(value)}`;

/* ---------- Job seekers ---------- */

// Sent once, right after a new job seeker confirms their email.
export function welcomeSeeker(a: { name: string }) {
  return build(
    "Welcome to RemoteCore",
    "Your account is ready. Finish your profile so employers can find you.",
    "Your account is ready",
    [
      `Hi ${first(a.name)},`,
      "Your email is confirmed and your RemoteCore account is ready.",
      "Next, finish your profile. Add your work history, skills, resume and a short voice introduction. Complete profiles get reviewed first.",
    ],
    { label: "Finish my profile", href: `${SITE}/portal/profile` },
  );
}

export type AlertJob = { title: string; category: string; facts: string; url: string };

// Weekly: new jobs in the categories the seeker chose in their profile.
export function jobAlert(a: { name: string; jobs: AlertJob[]; unsubscribe: string }) {
  const n = a.jobs.length;
  const list = a.jobs.map((j) => `<a href="${j.url}" style="color:#0B7F77;font-weight:600;text-decoration:none">${esc(j.title)}</a><br><span style="font-size:14px;color:#5B5571">${esc([j.category, j.facts].filter(Boolean).join(" · "))}</span>`);
  return build(
    n === 1 ? `A new remote job for you: ${a.jobs[0].title}` : `${n} new remote jobs for you this week`,
    a.jobs.slice(0, 3).map((j) => j.title).join(", "),
    n === 1 ? "A new job that fits your profile" : `${n} new jobs that fit your profile`,
    [`Hi ${first(a.name)},`, "These jobs were posted this week in the categories you chose.", ...list],
    { label: "See all jobs", href: `${SITE}/portal/jobs` },
    `You chose these categories in your profile. <a href="${SITE}/portal/profile" style="color:#5B5571">Change them</a> or <a href="${a.unsubscribe}" style="color:#5B5571">stop job alerts</a>.`,
  );
}

/* ---------- Employers ---------- */

// Right after an employer creates a company account. RemoteCore approves new employers before they can post.
export function employerWelcome(a: { name: string; company: string }) {
  return build(
    "We received your company account",
    "Our team checks every new employer account. We will email you when it is approved.",
    "Thanks for registering",
    [
      `Hi ${first(a.name)},`,
      `We received the account for <b>${esc(a.company)}</b>.`,
      "Our team checks every new employer account before it goes live. We will email you as soon as yours is approved. Until then you can log in and finish your company profile.",
    ],
    { label: "Go to my dashboard", href: `${SITE}/portal` },
  );
}

export function employerApproved(a: { name: string; company: string }) {
  return build(
    "Your company account is approved",
    "You can now post jobs and send staffing requests.",
    "Your account is approved",
    [`Hi ${first(a.name)},`, `<b>${esc(a.company)}</b> is approved on RemoteCore.`, "You can now post jobs, send staffing requests and review candidates from your dashboard."],
    { label: "Post a job", href: `${SITE}/portal` },
  );
}

// After a staffing request, from the dashboard or the public form.
export function staffingRequestReceived(a: { name: string; position: string; ref: string; account: boolean }) {
  return build(
    `We received your staffing request for ${a.position}`,
    "A recruiter will review it and contact you about next steps.",
    "Staffing request received",
    [
      `Hi ${first(a.name)},`,
      `We received your request for <b>${esc(a.position)}</b>. Your reference is <b>${esc(a.ref)}</b>.`,
      "A recruiter will review the details and contact you to talk about next steps and the candidates we can find for you.",
    ],
    a.account ? { label: "See my requests", href: `${SITE}/portal` } : undefined,
    undefined,
    a.account ? undefined : FORM_FOOTER,
  );
}

// RemoteCore moves a staffing request forward (for example, candidates shared or interviews set).
export function recruitmentUpdate(a: { name: string; position: string; update: string }) {
  return build(
    `Update on your request for ${a.position}`,
    a.update,
    "Recruitment update",
    [`Hi ${first(a.name)},`, esc(a.update), `Position: <b>${esc(a.position)}</b>`],
    { label: "Open my dashboard", href: `${SITE}/portal` },
  );
}

// Stripe confirmed a payment.
export function paymentReceived(a: { name: string; amountCents: number; currency: string; description: string; at: string; receiptUrl?: string }) {
  return build(
    `Payment received: ${money(a.amountCents, a.currency)}`,
    `Thank you. We received your payment for ${a.description}.`,
    "Payment received",
    [`Hi ${first(a.name)},`, `Thank you. We received your payment of <b>${money(a.amountCents, a.currency)}</b> on ${day(a.at)}.`, row("For", a.description)],
    a.receiptUrl ? { label: "View my receipt", href: a.receiptUrl } : { label: "See my billing", href: `${SITE}/portal` },
  );
}

// A new invoice is ready to pay.
export function invoiceReady(a: { name: string; number: string; amountCents: number; currency: string; description: string; due?: string; payUrl: string }) {
  return build(
    `Invoice ${a.number} from RemoteCore: ${money(a.amountCents, a.currency)}`,
    `${money(a.amountCents, a.currency)} for ${a.description}${a.due ? `, due ${day(a.due)}` : ""}.`,
    "You have a new invoice",
    [
      `Hi ${first(a.name)},`,
      `Invoice <b>${esc(a.number)}</b> for <b>${money(a.amountCents, a.currency)}</b> is ready.`,
      row("For", a.description),
      ...(a.due ? [row("Due", day(a.due))] : []),
    ],
    { label: "View and pay", href: a.payUrl },
    "You can pay by card on the secure page. Reply to this email if anything looks wrong.",
  );
}

// A new member of the RemoteCore team. They set their own password with the reset link on the login page.
export function teamInvite(a: { name: string; by: string; level: string }) {
  return build(
    "You were added to the RemoteCore team",
    "Set your password and log in to the admin dashboard.",
    `Welcome, ${first(a.name)}`,
    [`${esc(a.by)} added you to the RemoteCore Outsourcing team as <b>${esc(a.level)}</b>.`, "To log in the first time, choose your password with the button below. Enter this email address and we send you a link."],
    { label: "Choose my password", href: `${SITE}/forgot-password` },
    "If you did not expect this, you can ignore this email.",
  );
}

// Employer: RemoteCore approved their job, or sent it back with what to change.
export function jobApproved(a: { name: string; title: string }) {
  return build(`Your job is live: ${a.title}`, "Job seekers can now find it and apply.", "Your job is live",
    [`Hi ${first(a.name)},`, `We approved <b>${esc(a.title)}</b>. Job seekers can now find it and apply. We email you when someone applies.`],
    { label: "See your jobs", href: `${SITE}/portal/postings` });
}
export function jobNeedsChanges(a: { name: string; title: string; reason: string }) {
  return build(`Please update your job: ${a.title}`, "A small change is needed before it goes live.", "Your job needs a change",
    [`Hi ${first(a.name)},`, `Before <b>${esc(a.title)}</b> goes live, please change this:`, `<span style="white-space:pre-line">${esc(a.reason)}</span>`, "Open the job, make the change and send it for review again."],
    { label: "Edit the job", href: `${SITE}/portal/postings` });
}

// Employer: the RemoteCore team answered their message.
export function teamReply(a: { name: string; body: string }) {
  return build("RemoteCore replied to your message", a.body.slice(0, 90), "New message from RemoteCore",
    [`Hi ${first(a.name)},`, `<span style="white-space:pre-line">${esc(a.body)}</span>`],
    { label: "Reply on your dashboard", href: `${SITE}/portal/messages` });
}

/* ---------- RemoteCore team ---------- */

const team = (subject: string, heading: string, lines: string[], href = `${SITE}/portal`) =>
  build(subject, lines[0].replace(/<[^>]+>/g, ""), heading, lines, { label: "Open the dashboard", href }, undefined, TEAM_FOOTER);

export const newSeekerAdmin = (a: { name: string; email: string; country: string }) =>
  team(`New job seeker: ${a.name || a.email}`, "New job seeker", [`<b>${esc(a.name || "A new job seeker")}</b> created an account and confirmed their email.`, row("Email", a.email), ...(a.country ? [row("Country", a.country)] : [])]);

export const newEmployerAdmin = (a: { company: string; contact: string; email: string; country: string; industry: string }) =>
  team(`New employer to approve: ${a.company}`, "New employer account", [`<b>${esc(a.company)}</b> registered and is waiting for approval.`, row("Contact", a.contact), row("Email", a.email), ...(a.country ? [row("Country", a.country)] : []), ...(a.industry ? [row("Industry", a.industry)] : [])]);

export const newJobPostAdmin = (a: { title: string; company: string; status: string }) =>
  team(`New job post: ${a.title}`, "New job post", [`<b>${esc(a.company)}</b> posted <b>${esc(a.title)}</b>.`, row("Status", a.status)]);

export const newStaffingRequestAdmin = (a: { company: string; contact: string; email: string; position: string; hires: string; ref: string }) =>
  team(`New staffing request: ${a.position} for ${a.company}`, "New staffing request", [`<b>${esc(a.company)}</b> needs <b>${esc(a.position)}</b>.`, row("Hires", a.hires || "Not given"), row("Contact", `${a.contact} (${a.email})`), row("Reference", a.ref)]);

export const newEmployerMessageAdmin = (a: { company: string; contact: string; body: string; about?: string }) =>
  team(`New message from ${a.company}`, "New message from an employer", [`<b>${esc(a.company)}</b> (${esc(a.contact)}) sent a message.`, ...(a.about ? [row("About", a.about)] : []), `<span style="white-space:pre-line">${esc(a.body)}</span>`]);

export const newPaymentAdmin = (a: { company: string; amountCents: number; currency: string; description: string }) =>
  team(`Payment received: ${money(a.amountCents, a.currency)} from ${a.company}`, "New payment", [`<b>${esc(a.company)}</b> paid <b>${money(a.amountCents, a.currency)}</b>.`, row("For", a.description)]);

/* ---------- Public forms ---------- */

export const FORM_NAMES: Record<string, string> = {
  consultation: "Consultation request", "staffing-request": "Staffing request", candidate: "Candidate details",
  contact: "Contact form message", introduction: "Candidate introduction request", "career-session": "Career session booking",
  "learning-notify": "Learning Hub waiting list",
};
const label = (k: string) => k.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());

// To the team: every field the visitor sent. Reply goes straight to the visitor.
export function formAdmin(kind: string, entry: Record<string, string>, ref: string) {
  const name = entry.full_name || entry.contact_name || entry.email || "Someone";
  const fields = Object.entries(entry).filter(([k]) => k !== "consent").map(([k, v]) => row(label(k), v).replace(/\n/g, "<br>"));
  return team(`${FORM_NAMES[kind] ?? "New form"}: ${name}`, FORM_NAMES[kind] ?? "New form", [`<b>${esc(name)}</b> sent the ${esc((FORM_NAMES[kind] ?? "form").toLowerCase())} form. Reply to this email to answer them.`, ...fields, row("Reference", ref)]);
}

const FORM_REPLY: Record<string, { subject: string; heading: string; line: (e: Record<string, string>) => string; button?: { label: string; href: string } }> = {
  consultation: { subject: "We received your consultation request", heading: "Consultation request received", line: () => "Thanks for reaching out. A member of our team will contact you to set a time that works for you." },
  candidate: { subject: "We received your details", heading: "Thanks for your interest", line: () => "We received your details. To apply for open jobs and be seen by employers, create your free profile.", button: { label: "Create my profile", href: `${SITE}/register/job-seeker` } },
  contact: { subject: "We received your message", heading: "Message received", line: () => "Thanks for your message. Our team will reply to you by email." },
  introduction: { subject: "We received your introduction request", heading: "Introduction request received", line: () => "Thanks. We will check that the candidates you chose are available and get back to you about the next steps." },
  "career-session": { subject: "We received your booking request", heading: "Booking request received", line: (e) => `Thanks for booking${e.service ? ` <b>${esc(e.service.slice(0, 60))}</b>` : " a career session"}. We will email you to set a time.` },
  "learning-notify": { subject: "You are on the Learning Hub list", heading: "You are on the list", line: () => "Thanks. We will email you when the first courses open in the RemoteCore Learning Hub." },
};

// To the visitor: a short receipt for the form they sent.
export function formReceived(kind: string, entry: Record<string, string>, ref: string): Built | null {
  // Receipts repeat as little of the visitor's own text as possible, and never much of it.
  if (kind === "staffing-request") return staffingRequestReceived({ name: (entry.full_name || "").slice(0, 60), position: (entry.roles || "your open roles").slice(0, 60), ref, account: false });
  const r = FORM_REPLY[kind];
  if (!r) return null;
  const name = entry.full_name || entry.contact_name || "";
  return build(r.subject, r.line(entry).replace(/<[^>]+>/g, ""), r.heading, [`Hi ${first(name)},`, r.line(entry), `Your reference is <b>${esc(ref)}</b>.`], r.button, undefined, FORM_FOOTER);
}

/* ---------- Added after the call on 2026-11-23 ---------- */

// Job seeker: the whole application (profile) is complete for the first time.
export function profileSubmitted(a: { name: string }) {
  return build(
    "We received your application",
    "Thank you for applying to RemoteCore. Our team will review your profile.",
    "Application received",
    [
      `Hi ${first(a.name)},`,
      "Thank you for applying to RemoteCore Outsourcing. Your application is complete and it reached our team.",
      "We review every application. If your profile fits a role, we will email you to book a short interview. You can update your profile at any time.",
    ],
    { label: "See my profile", href: `${SITE}/portal/profile` },
  );
}

export const newProfileAdmin = (a: { name: string; email: string; country: string; id: string }) =>
  team(`New application: ${a.name || a.email}`, "New completed application", [`<b>${esc(a.name || "A job seeker")}</b> completed every part of their application.`, row("Email", a.email), ...(a.country ? [row("Country", a.country)] : [])], `${SITE}/portal/admin/candidates/${a.id}`);

// Job seeker: shortlisted, pick an interview time.
export function interviewInvite(a: { name: string; job?: string | null }) {
  return build(
    "You were shortlisted. Please pick an interview time",
    "Choose a time that suits you for a short interview with RemoteCore.",
    "You were shortlisted",
    [
      `Hi ${first(a.name)},`,
      a.job ? `Good news. You were shortlisted for <b>${esc(a.job)}</b>.` : "Good news. You were shortlisted.",
      "The next step is a short video interview with our team. Please pick a time that suits you. You will see the times in your own time zone.",
      "In the interview we will ask you to share your screen, so please join from the computer you would work on.",
    ],
    { label: "Pick my interview time", href: `${SITE}/portal/interview` },
  );
}

// Job seeker: interview booked (also used for the reminder the day before).
export function interviewBooked(a: { name: string; when: string; link: string | null; reminder?: boolean }) {
  const lines = [
    `Hi ${first(a.name)},`,
    a.reminder ? `This is a reminder of your interview with RemoteCore on <b>${esc(a.when)}</b>.` : `Your interview with RemoteCore is booked for <b>${esc(a.when)}</b>.`,
    a.link ? `Join the meeting here: <a href="${esc(a.link)}">${esc(a.link)}</a>` : "We will send you the meeting link before the interview.",
    "Please join from the computer you would work on. We will ask you to share your screen.",
  ];
  if (!a.reminder) lines.push("The calendar file attached to this email adds the interview to your calendar.");
  return build(
    a.reminder ? "Reminder: your RemoteCore interview" : "Your RemoteCore interview is booked",
    a.when,
    a.reminder ? "Your interview is coming up" : "Interview booked",
    lines,
    { label: "See or change my interview", href: `${SITE}/portal/interview` },
  );
}

export const interviewBookedAdmin = (a: { name: string; email: string; when: string; job?: string | null; id: string }) =>
  team(`Interview booked: ${a.name || a.email}`, "New interview booked", [`<b>${esc(a.name || a.email)}</b> booked an interview.`, row("When", a.when), row("Email", a.email), ...(a.job ? [row("Role", a.job)] : [])], `${SITE}/portal/admin/candidates/${a.id}`);

// Employer and team: a copy of the signed agreement.
export function contractCopy(a: { name: string; title: string; body: string; signedAt: string; signer: string; company: string; team?: boolean }) {
  return build(
    a.team ? `Signed: ${a.title} (${a.company})` : `Your signed copy: ${a.title}`,
    `Signed by ${a.signer} for ${a.company}`,
    a.team ? "An agreement was signed" : "Your signed agreement",
    [
      a.team ? `<b>${esc(a.signer)}</b> signed <b>${esc(a.title)}</b> for <b>${esc(a.company)}</b>.` : `Hi ${first(a.name)}, here is your copy of the agreement you signed.`,
      row("Signed", `${when(a.signedAt)} by ${a.signer}`),
      `<span style="white-space:pre-line">${esc(a.body)}</span>`,
    ],
    { label: a.team ? "Open the dashboard" : "See it in your dashboard", href: `${SITE}${a.team ? "/portal/admin/contracts" : "/portal/contract"}` },
  );
}
