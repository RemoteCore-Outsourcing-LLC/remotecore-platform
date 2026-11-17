import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = { title: "Join as a job seeker", robots: { index: false } };

export default function JobSeekerSignup() {
  return (
    <AuthShell title="Join Our Talent Network" lede="Create your free account. After you confirm your email, you can add your experience, computer details, resume and a short voice introduction.">
      <SignupForm />
    </AuthShell>
  );
}
