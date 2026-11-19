import type { Metadata } from "next";
import { PageHero } from "@/components/site/Blocks";
import { LegalBody, LegalContact, LEGAL_UPDATED } from "@/components/site/Legal";

export const metadata: Metadata = { title: "Privacy Policy", description: "How RemoteCore Outsourcing collects, uses, shares and protects your personal information." };

export default function Page() {
  return (
    <>
      <PageHero page="privacy" />
      <LegalBody>
        <p className="legal__date">Last updated: {LEGAL_UPDATED}</p>
        <p>This policy explains what personal information RemoteCore Outsourcing LLC (&quot;RemoteCore&quot;, &quot;we&quot;, &quot;us&quot;) collects on remotecoreoutsourcing.com, why we collect it, who we share it with, and the choices you have. It covers job seekers, employers and anyone who visits the site or sends us a form.</p>

        <h2>1. Information We Collect</h2>
        <h3>From Job Seekers</h3>
        <ul>
          <li>Account details: your name, email address, phone number, country and password. We never see your password; it is stored in a protected form.</li>
          <li>Your profile: work history, education, certifications, skills, languages, years of experience, the kind of work and pay you are looking for, availability, working hours and time zone.</li>
          <li>Your computer and internet setup, such as device type, operating system, memory and connection.</li>
          <li>Files you upload: your resume, your voice introduction and any documents an application asks for.</li>
          <li>Your activity: the jobs you save and apply to, and the status of each application.</li>
        </ul>
        <h3>From Employers</h3>
        <ul>
          <li>Account and company details: your name, business email, phone, company name, country and industry.</li>
          <li>The jobs you post, staffing requests you send, and messages you exchange with our team.</li>
          <li>Billing records: invoices, amounts and payment status. Card payments are handled by Stripe. We never receive or store your full card number.</li>
        </ul>
        <h3>From Everyone</h3>
        <ul>
          <li>What you write in our contact, consultation, career services and other forms.</li>
          <li>A scrambled version of your IP address when you send a form, used only to stop spam and abuse. We cannot turn it back into your IP address.</li>
          <li>Login cookies that keep you signed in. We do not use advertising cookies or tracking tools.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To run your account and the services you ask for.</li>
          <li>To match job seekers with roles, review applications and support hiring.</li>
          <li>To send emails you need, such as sign up confirmations, password resets, application updates and invoices.</li>
          <li>To send weekly job alerts, if you turn them on. Every alert has a link to stop them.</li>
          <li>To answer your questions and requests.</li>
          <li>To bill employers and keep accounting records.</li>
          <li>To keep the platform safe and prevent fraud and misuse.</li>
        </ul>
        <p>We do not sell your personal information, and we do not use it for advertising.</p>

        <h2>3. Who Sees Your Information</h2>
        <ul>
          <li>The RemoteCore team, to run the platform and support you.</li>
          <li>Employers you apply to. They see your profile, resume and voice introduction for that job. They do not see your email address or phone number. All contact goes through RemoteCore.</li>
          <li>The public, only if you choose to join our Talent Marketplace in your settings. Your public card shows your first name and last initial, headline, skills, languages and experience. It never shows your email, phone number or files. You can leave the marketplace at any time.</li>
          <li>Service providers that run parts of the platform for us: Supabase (database, logins and file storage), Vercel (website hosting), Resend (email delivery), Stripe (card payments) and Cloudflare (domain). They may only use your information to provide their service to us.</li>
          <li>Authorities, when the law requires it.</li>
        </ul>

        <h2>4. How We Protect It</h2>
        <p>Resumes, voice introductions and documents are kept in private storage. They open only through links that expire after a few minutes. Access rules on every part of our database limit each person to the information they are allowed to see. Connections to the site are encrypted. No system is perfectly secure, but we work to protect your information and review our security regularly.</p>

        <h2>5. How Long We Keep It</h2>
        <p>We keep your account information while your account is open. When you delete your account, we delete your profile, files, applications and saved jobs. We keep invoices and payment records for as long as tax and accounting laws require. Form messages are kept while they are useful to answer you and then removed.</p>

        <h2>6. Your Choices and Rights</h2>
        <ul>
          <li>Update your profile and account details at any time in your portal.</li>
          <li>Turn job alerts on or off in your settings, or use the link in any alert.</li>
          <li>Join or leave the Talent Marketplace in your settings.</li>
          <li>Delete your account yourself in your settings.</li>
          <li>Ask us for a copy of your information, to correct it, or to delete it, using the contact details below.</li>
        </ul>
        <p>Depending on where you live, you may have more rights under local law, such as the right to object to some uses or to complain to your data protection authority. We respond to every request within 30 days.</p>

        <h2>7. International Users</h2>
        <p>RemoteCore is based in the United States, and our service providers store information in the United States. If you use the platform from another country, your information is transferred to and processed in the United States.</p>

        <h2>8. Age</h2>
        <p>The platform is for people who are 18 or older. We do not knowingly collect information from anyone younger.</p>

        <h2>9. Changes to This Policy</h2>
        <p>If we change this policy, we will update the date at the top of this page. If the change is important, we will also let account holders know by email.</p>

        <h2>10. Contact Us</h2>
        <p>For any question or request about your information, contact:</p>
        <LegalContact />
      </LegalBody>
    </>
  );
}
