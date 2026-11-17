import type { Metadata } from "next";
import { Close, PageHero } from "@/components/site/Blocks";
import { Consent, Field, Form } from "@/components/site/Form";
import { Marketplace, type Profile } from "@/components/site/Marketplace";

export const metadata: Metadata = { title: "Talent Marketplace", description: "Explore skilled remote professionals across healthcare administration, customer support, virtual assistance, and business operations." };

// Sample profiles until real, consented profiles are approved by an admin.
// TODO (database step): load approved profiles from Supabase instead.
const profiles: Profile[] = [
  { id: "RC-1042", name: "Amara O.", role: "Patient Intake Coordinator", specialty: "Healthcare Administration", summary: "Scheduling, patient registration and insurance eligibility checks for busy outpatient clinics.", years: "5+ years", skills: ["EHR documentation", "Insurance verification", "Scheduling"], availability: "Full time", zone: "Africa / Europe", languages: ["English"] },
  { id: "RC-1077", name: "Marco D.", role: "Customer Support Specialist", specialty: "Customer Support", summary: "Phone, email and live chat support for online stores, with ticket and CRM follow up.", years: "3 to 5 years", skills: ["Zendesk", "Live chat", "CRM"], availability: "Full time", zone: "Asia Pacific", languages: ["English", "Filipino"] },
  { id: "RC-1103", name: "Lucía R.", role: "Executive Assistant", specialty: "Virtual Assistance", summary: "Inbox and calendar management, travel planning and document preparation for executives.", years: "5+ years", skills: ["Google Workspace", "Calendar management", "Travel"], availability: "Part time", zone: "Americas", languages: ["English", "Spanish"] },
  { id: "RC-1128", name: "Kevin M.", role: "Appointment Setter", specialty: "Sales Support", summary: "Lead research, outbound follow ups and booking sales meetings into the team calendar.", years: "1 to 3 years", skills: ["HubSpot", "Lead research", "Outreach"], availability: "Full time", zone: "Africa / Europe", languages: ["English", "Swahili"] },
  { id: "RC-1150", name: "Bruna C.", role: "Medical Receptionist", specialty: "Healthcare Administration", summary: "Answers patient calls, confirms appointments and coordinates referrals.", years: "1 to 3 years", skills: ["Phone support", "Referrals", "Scheduling"], availability: "Part time", zone: "Americas", languages: ["English", "Portuguese"] },
  { id: "RC-1186", name: "Thabo N.", role: "IT Help Desk Technician", specialty: "Technology & IT", summary: "Solves staff computer and account problems by chat, phone and remote session.", years: "3 to 5 years", skills: ["Microsoft 365", "Windows", "Ticketing"], availability: "Full time", zone: "Africa / Europe", languages: ["English"] },
  { id: "RC-1201", name: "Priya S.", role: "Bookkeeper", specialty: "Finance & Accounting", summary: "Monthly bookkeeping, invoicing and bank reconciliation for small businesses.", years: "5+ years", skills: ["QuickBooks", "Reconciliation", "Invoicing"], availability: "Contract", zone: "Asia Pacific", languages: ["English", "Hindi"] },
  { id: "RC-1219", name: "Daniela V.", role: "Virtual Assistant", specialty: "Virtual Assistance", summary: "Data entry, research, meeting coordination and general admin support.", years: "1 to 3 years", skills: ["Data entry", "Research", "Excel"], availability: "Full time", zone: "Americas", languages: ["English", "Spanish"] },
];

export default function TalentMarketplace() {
  return (
    <>
      <PageHero eyebrow="RemoteCore Talent Marketplace" title="Discover Talent. Build Your Team." lede="Explore skilled remote professionals across healthcare administration, customer support, virtual assistance, and business operations. Find a potential match and let RemoteCore coordinate the next step.">
        <a className="btn btn--main" href="#browse">Browse Talent</a>
        <a className="btn btn--line" href="/hire-talent#request">Request Custom Recruitment</a>
      </PageHero>

      <section className="sec sec--pale" id="browse">
        <div className="wrap">
          <Marketplace profiles={profiles} />
          <p className="soft" style={{ marginTop: 22, fontSize: 14 }}>Profiles are published with candidate permission. Candidate availability and suitability are confirmed during the introduction process. The profiles shown now are samples.</p>
        </div>
      </section>

      <section className="sec">
        <div className="wrap split split--top">
          <div data-sc-in>
            <h2>Request an Introduction</h2>
            <p className="lede">Tell us which profiles you are interested in and what the role needs. Our recruitment team confirms each person&apos;s interest and availability before arranging interviews.</p>
          </div>
          <div className="panel" id="introduction">
            <Form kind="introduction" submitLabel="Request an Introduction" thanksText="Thank you. Our recruitment team will review your request and contact you about next steps.">
              <div className="two">
                <Field label="Company name" name="company" required autoComplete="organization" />
                <Field label="Contact name" name="contact_name" required autoComplete="name" />
              </div>
              <div className="two">
                <Field label="Work email" name="email" type="email" required autoComplete="email" />
                <Field label="Business website" name="website" type="url" optional autoComplete="url" />
              </div>
              <div className="two">
                <Field label="Job title" name="job_title" required />
                <Field label="Selected profile IDs" name="profile_ids" required placeholder="RC-1042, RC-1077" />
              </div>
              <Field label="Role requirements" name="requirements" type="textarea" required rows={3} />
              <Field label="Preferred interview times" name="interview_times" optional />
              <Consent>I agree that RemoteCore may contact me about this request, as described in the <a href="/privacy">Privacy Policy</a>. I understand that hiring a professional introduced by RemoteCore includes an agreed placement fee, with final terms provided before engagement.</Consent>
            </Form>
          </div>
        </div>
      </section>

      <Close title="Can’t find the right profile?" text="Tell us what you need and we will recruit for you.">
        <a className="btn btn--main" href="/hire-talent#request">Request Talent</a>
      </Close>
    </>
  );
}
