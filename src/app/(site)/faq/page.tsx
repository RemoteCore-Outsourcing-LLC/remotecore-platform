import type { Metadata } from "next";
import { Close, Faq, PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "FAQs", description: "Answers about hiring with RemoteCore, joining the talent network, and the Learning Hub." };

const faqs: [string, string][] = [
  ["What does RemoteCore Outsourcing do?", "We help businesses recruit remote professionals for healthcare administration, customer support, virtual assistance, and other business support roles."],
  ["How does the recruitment process work?", "Tell us what you need. We source and screen candidates, introduce suitable professionals, and support the selection process."],
  ["Who pays the remote professional?", "Under our direct hire model, the client hires and pays the selected professional directly. RemoteCore charges an agreed placement fee."],
  ["Can RemoteCore help with healthcare staffing?", "We recruit for non clinical healthcare administrative support roles, subject to the client’s requirements and applicable rules."],
  ["Can I browse talent before contacting RemoteCore?", "Yes. You can browse limited professional profiles and request an introduction through our team. Candidate details and availability are confirmed before interviews."],
  ["Can I join the talent network for free?", "Candidate registration is intended to be free. Any optional paid learning or career services are clearly separate from job applications."],
  ["Does joining guarantee a job?", "No. Registration allows consideration for suitable opportunities but does not guarantee placement."],
  ["Are Learning Hub courses mandatory for job seekers?", "No. Training and coaching are optional and not a condition of applying for opportunities."],
  ["Will I receive a certificate after training?", "Eligible learners who meet course requirements may receive a RemoteCore Certificate of Completion. This is not a third party professional license or vendor certification."],
  ["How much does recruitment cost?", "Fees depend on the agreed recruitment terms. Contact our team for a proposal."],
  ["What if I need a role not listed?", "Submit your staffing needs through the Request Talent form and we can discuss your requirements."],
];

export default function FaqPage() {
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <PageHero eyebrow="FAQs" title="Frequently Asked Questions" />
      <section className="sec sec--pale"><div className="wrap"><Faq items={faqs} /></div></section>
      <Close title="Still have a question?">
        <a className="btn btn--main" href="/contact">Contact Us</a>
      </Close>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
