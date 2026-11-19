// Company details shown on the site. Only verified details go here.
// TODO (client): phone number and public email are still missing. They appear on the site as soon as they are filled in.
export const company = {
  name: "RemoteCore Outsourcing LLC",
  short: "RemoteCore Outsourcing",
  tagline: "Global talent. Meaningful opportunities. Stronger businesses.",
  address: ["816 William S Canning Blvd #1036", "Fall River, MA 02721", "United States"],
  phone: "" as string,
  email: "" as string,
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/company/remotecore-outsourcing-llc" },
    { label: "Instagram", href: "https://www.instagram.com/remotecoreoutsourcing" },
    { label: "TikTok", href: "https://www.tiktok.com/@remotecore.outsou" },
  ],
};

export type NavLink = { href: string; label: string };
export type NavItem = NavLink | { label: string; children: NavLink[] };

// The job seeker pages sit under one "For Talent" menu so the bar stays calm (Sasha's fixes, 2026-11-19).
export const nav: NavItem[] = [
  { href: "/about", label: "About Us" },
  { href: "/services", label: "Our Services" },
  { href: "/talent-marketplace", label: "Talent Marketplace" },
  { href: "/hire-talent", label: "Hire Talent" },
  { label: "For Talent", children: [
    { href: "/find-opportunities", label: "Find Opportunities" },
    { href: "/learning-hub", label: "Learning Hub" },
    { href: "/career-services", label: "Career Services" },
  ] },
  { href: "/contact", label: "Contact Us" },
];

export const loginLinks: NavLink[] = [
  { href: "/login?as=client", label: "Client Login" },
  { href: "/login?as=applicant", label: "Applicant Login" },
];

export const talentCategories = [
  "Healthcare Administrative Support",
  "Customer Experience & Support",
  "Virtual & Executive Assistance",
  "Sales & Business Support",
  "Real Estate & Hospitality",
  "Technology & IT",
  "Finance & Accounting",
  "Project Managers & Estimators",
  "Custom Role",
];
