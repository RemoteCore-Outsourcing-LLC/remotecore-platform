// Default text for the parts of the site the team can edit from the admin dashboard.
export type MainService = { icon: string; name: string; title: string; items: string[]; note?: string };
export type MoreService = { icon: string; name: string; text: string };
export const SERVICE_ICONS = ["health", "support", "assist", "sales", "tech", "money", "plan", "home"];

export const DEFAULT_FAQ: [string, string][] = [
  ["What does RemoteCore Outsourcing do?", "We help businesses recruit remote professionals for healthcare administration, customer support, virtual assistance, and other business support roles."],
  ["How does the recruitment process work?", "Tell us what you need. We source and screen candidates, introduce suitable professionals, and support the selection process."],
  ["Who pays the remote professional?", "Under our direct hire model, the client hires and pays the selected professional directly. RemoteCore charges a one-time flat placement fee."],
  ["Can RemoteCore help with healthcare staffing?", "We recruit for non clinical healthcare administrative support roles, subject to the client’s requirements and applicable rules."],
  ["Can I browse talent before contacting RemoteCore?", "Yes. You can browse limited professional profiles and request an introduction through our team. Candidate details and availability are confirmed before interviews."],
  ["Can I join the talent network for free?", "Candidate registration is intended to be free. Any optional paid learning or career services are clearly separate from job applications."],
  ["Does joining guarantee a job?", "No. Registration allows consideration for suitable opportunities but does not guarantee placement."],
  ["Are Learning Hub courses mandatory for job seekers?", "No. Training and coaching are optional and not a condition of applying for opportunities."],
  ["Will I receive a certificate after training?", "Eligible learners who meet course requirements may receive a RemoteCore Certificate of Completion. This is not a third party professional license or vendor certification."],
  ["How much does recruitment cost?", "Talent starts at $5/hr, paid directly to your hire. RemoteCore charges a one-time flat placement fee, due only when you hire, with $0 upfront deposit and no ongoing markups. Book a free consultation to receive your custom quote."],
  ["Is there a guarantee?", "Yes. If a placed candidate is not the right fit within their first 60 days, we source and place one replacement at no additional placement fee. The full conditions are in our Terms of Use."],
  ["What if I need a role not listed?", "Submit your staffing needs through the Request Talent form and we can discuss your requirements."],
];

export const DEFAULT_MAIN: MainService[] = [
  { icon: "health", name: "Healthcare Administrative Support", title: "Helping Healthcare Teams Focus on Patient Care.", items: ["Appointment scheduling", "Patient intake and registration", "Insurance eligibility and benefits verification", "Medical records and EHR documentation", "Referral and follow up coordination", "Pharmacy communication and administrative support"], note: "Tasks are performed within client authorized workflows, applicable privacy requirements, and role scope." },
  { icon: "support", name: "Customer Experience & Support", title: "Every Interaction Matters.", items: ["Inbound phone support", "Email and live chat", "Ticket management", "Customer follow ups", "Issue resolution", "CRM documentation", "Escalation coordination"] },
  { icon: "assist", name: "Virtual & Executive Assistance", title: "Less Administrative Work. More Room to Grow.", items: ["Inbox and calendar management", "Scheduling", "Document preparation", "Research", "Data entry", "Meeting coordination", "General administrative support"] },
  { icon: "sales", name: "Sales & Business Support", title: "Keep Your Business Moving.", items: ["Lead research", "Appointment setting", "CRM updates", "Outreach follow ups", "Pipeline administration", "Reporting support"] },
];

export const DEFAULT_MORE: MoreService[] = [
  { icon: "tech", name: "Technology & IT", text: "Technical support, IT help desk, software troubleshooting and digital operations." },
  { icon: "money", name: "Finance & Accounting", text: "Bookkeeping, invoicing, payroll administration, expense tracking and financial reporting support." },
  { icon: "plan", name: "Project Managers & Estimators", text: "Project coordination, scheduling, cost estimation, budgeting, progress tracking and reporting." },
  { icon: "home", name: "Real Estate & Hospitality", text: "Property management assistants, reservation agents and guest support specialists." },
];
