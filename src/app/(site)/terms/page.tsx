import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";

export const metadata: Metadata = { title: "Terms of Use", robots: { index: false } };

// TODO (launch step): replace with the full draft for the client's lawyer to review.
export default function Page() {
  return (
    <>
      <PageHero page="terms" />
      <section className="sec"><div className="wrap"><a className="btn btn--main" href="/contact">Contact Us</a></div></section>
    </>
  );
}
