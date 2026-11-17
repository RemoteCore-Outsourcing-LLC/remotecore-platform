import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ForgotForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };
export default function Forgot() {
  return <AuthShell title="Forgot your password?" lede="Enter your email and we will send you a link to choose a new one."><ForgotForm /></AuthShell>;
}
