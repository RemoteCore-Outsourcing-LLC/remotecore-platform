import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  return (
    <AuthShell title="Welcome back." lede="Job seekers, employers and the RemoteCore team all log in here.">
      <LoginForm next={sp.next} linkError={sp.error === "link"} />
    </AuthShell>
  );
}
