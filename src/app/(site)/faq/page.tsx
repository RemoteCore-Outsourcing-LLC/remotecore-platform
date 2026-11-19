import type { Metadata } from "next";
import { Close, Faq, PageHero } from "@/components/site/Blocks";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "FAQs", description: "Answers about hiring with RemoteCore, joining the talent network, and the Learning Hub." };


export default async function FaqPage() {
  const { faq: faqs } = await getSettings();
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <>
      <PageHero page="faq" />
      <section className="sec sec--pale"><div className="wrap"><Faq items={faqs} /></div></section>
      <Close title="Still Have a Question?">
        <a className="btn btn--main" href="/contact">Contact Us</a>
      </Close>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
    </>
  );
}
