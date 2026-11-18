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
