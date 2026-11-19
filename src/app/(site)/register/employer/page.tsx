import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { EmployerSignupForm } from "@/components/auth/EmployerSignupForm";

export const metadata: Metadata = { title: "Create a company account", robots: { index: false } };

export default function EmployerSignup() {
  return (
    <AuthShell title="Hire Remote Talent With RemoteCore" lede="Create a company account to post jobs, send staffing requests and review candidates. Our team checks every new company before the account opens.">
      <EmployerSignupForm />
    </AuthShell>
  );
}
