import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log In", description: "Log in to your RemoteCore Outsourcing account to manage your profile, jobs and candidates.", robots: { index: false } };

// One login for everyone. The header has a button for each group, so the page speaks to who clicked.
const FOR = {
  client: { title: "Client Login", lede: "Log in to post jobs, review candidates, send staffing requests and pay invoices.", signup: "/register/employer" },
  applicant: { title: "Job Applicant Login", lede: "Log in to update your profile, apply for jobs and follow your applications.", signup: "/register/job-seeker" },
} as const;

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string; as?: string }> }) {
  const sp = await searchParams;
  const who = sp.as === "client" || sp.as === "applicant" ? FOR[sp.as] : null;
  return (
    <AuthShell title={who?.title ?? "Welcome back."} lede={who?.lede ?? "Job seekers, employers and the RemoteCore team all log in here."}>
      <LoginForm next={sp.next} linkError={sp.error === "link"} signup={who?.signup} />
    </AuthShell>
  );
}
