import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { ResetForm } from "@/components/auth/PasswordForms";

export const metadata: Metadata = { title: "New password", robots: { index: false } };
export default function Reset() {
  return <AuthShell title="Almost done." lede="Choose a new password for your account."><ResetForm /></AuthShell>;
}
