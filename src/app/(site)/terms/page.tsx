import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { LegalBody, LegalContact, LEGAL_UPDATED } from "@/components/site/Legal";

export const metadata: Metadata = { title: "Terms of Use", description: "The terms for using RemoteCore Outsourcing's website, job seeker portal and employer portal." };

export default function Page() {
  return (
    <>
      <PageHero page="terms" />
      <LegalBody>
        <p className="legal__date">Last updated: {LEGAL_UPDATED}</p>
        <p>These terms apply to remotecoreoutsourcing.com and the job seeker and employer portals (the &quot;platform&quot;), run by RemoteCore Outsourcing LLC (&quot;RemoteCore&quot;, &quot;we&quot;, &quot;us&quot;). By creating an account or using the platform, you agree to them. If you do not agree, please do not use the platform.</p>

        <h2>1. Who Can Use the Platform</h2>
        <p>You must be 18 or older. If you use the platform for a company, you confirm that you are allowed to accept these terms for that company.</p>

        <h2>2. Your Account</h2>
        <ul>
          <li>Give true and current information, and keep it up to date.</li>
          <li>Keep your password private. You are responsible for what happens in your account.</li>
          <li>Tell us right away if you think someone else has used your account.</li>
          <li>One account per person or company.</li>
        </ul>

        <h2>3. For Job Seekers</h2>
        <ul>
          <li>Your profile, resume and voice introduction must be your own and must be honest about your experience and skills.</li>
          <li>Creating an account or applying does not guarantee an interview, an offer or a job.</li>
          <li>Employers decide who they hire. Application statuses on the platform show progress only; they are not offers of employment.</li>
          <li>You choose whether to join the Talent Marketplace, and you can leave it at any time.</li>
        </ul>

        <h2>4. For Employers</h2>
        <ul>
          <li>New company accounts are reviewed by RemoteCore before they can post jobs or see candidates. We may decline or suspend any company account.</li>
          <li>Every job you post is reviewed before it goes live. Jobs must be real, lawful and accurately described, and must follow employment and anti discrimination laws.</li>
          <li>Candidate information is shared with you only to evaluate candidates for your roles. Do not copy it, sell it, share it, or use it for anything else.</li>
          <li>All contact with candidates goes through RemoteCore. Do not try to reach candidates directly or hire them outside RemoteCore to avoid our fees.</li>
          <li>Fees for our services are agreed with you before work starts and are shown on each invoice.</li>
        </ul>

        <h2>5. Payments</h2>
        <p>Invoices are paid by card through Stripe, a secure payment provider. Payment is due by the date on the invoice. Refunds are handled under the agreement for that service. Stripe&apos;s own terms also apply to your payment.</p>

        <h2>6. Things You May Not Do</h2>
        <ul>
          <li>Post false, misleading, offensive or illegal content.</li>
          <li>Pretend to be someone else, or use another person&apos;s information.</li>
          <li>Collect information about other users, or use bots or scrapers on the platform.</li>
          <li>Try to break into accounts, get around security, or disrupt the platform.</li>
          <li>Upload viruses or harmful files.</li>
          <li>Send spam or unwanted messages.</li>
        </ul>

        <h2>7. Your Content</h2>
        <p>You keep ownership of what you upload, such as your resume, voice introduction, job posts and messages. You allow RemoteCore to store, show and share it as needed to run the platform, as described in our <a href="/privacy">Privacy Policy</a>. You can remove it by editing your profile or deleting your account.</p>

        <h2>8. Our Content</h2>
        <p>The RemoteCore name, logo, website design and text belong to RemoteCore. You may not copy or reuse them without our written permission.</p>

        <h2>9. Suspending or Closing Accounts</h2>
        <p>You can delete your account at any time in your settings. We may suspend or close an account that breaks these terms, puts other users at risk, or is used for fraud.</p>

        <h2>10. Disclaimers</h2>
        <p>We work to keep the platform accurate and available, but we provide it &quot;as is&quot;. We do not promise it will always be available or free of errors. RemoteCore is not responsible for the decisions, conduct or information of employers or job seekers.</p>

        <h2>11. Limitation of Liability</h2>
        <p>To the extent the law allows, RemoteCore is not liable for indirect or consequential losses, such as lost profits or lost data, from your use of the platform. Our total liability to you for any claim is limited to the amount you paid us in the 12 months before the claim.</p>

        <h2>12. Governing Law</h2>
        <p>These terms are governed by the laws of the Commonwealth of Massachusetts, United States, without regard to its conflict of law rules.</p>

        <h2>13. Changes to These Terms</h2>
        <p>We may update these terms. We will change the date at the top of this page, and tell account holders by email about important changes. If you keep using the platform after a change, you accept the new terms.</p>

        <h2>14. Contact Us</h2>
        <LegalContact />
      </LegalBody>
    </>
  );
}
