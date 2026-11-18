// Shared by the employer sign up and the company profile screen.
export const INDUSTRIES = [
  "Healthcare", "Real Estate", "Hospitality and Travel", "E-commerce and Retail", "Technology and Software",
  "Finance and Accounting", "Insurance", "Legal", "Construction and Trades", "Marketing and Advertising",
  "Professional Services", "Education", "Logistics and Transportation", "Manufacturing", "Nonprofit", "Other",
];

export const COMPANY_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "Waiting for approval", tone: "info" },
  approved: { label: "Approved", tone: "good" },
  suspended: { label: "Suspended", tone: "bad" },
};

// Accepts "acme.com" or a full address, returns a clean https address or "".
export function cleanWebsite(raw: string) {
  const s = raw.trim();
  if (!s) return "";
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    return u.hostname.includes(".") ? u.toString().replace(/\/$/, "") : null;
  } catch { return null; }
}

export const JOB_STATUS: Record<string, { label: string; tone: string; help: string }> = {
  draft: { label: "Draft", tone: "neutral", help: "Only you can see it. Send it for review when it is ready." },
  pending: { label: "Waiting for review", tone: "info", help: "RemoteCore checks every job before it goes live." },
  published: { label: "Live", tone: "good", help: "Job seekers can find it and apply." },
  paused: { label: "Paused", tone: "neutral", help: "Hidden from job seekers. Turn it back on any time." },
  closed: { label: "Closed", tone: "bad", help: "No longer taking applications." },
};

export const REQUEST_STATUS: Record<string, { label: string; tone: string }> = {
  new: { label: "Received", tone: "info" },
  in_review: { label: "In progress", tone: "good" },
  closed: { label: "Closed", tone: "neutral" },
};

export const PERIODS: [string, string][] = [["month", "a month"], ["hour", "an hour"], ["week", "a week"], ["year", "a year"]];
