"use client";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export function ForgotForm() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const email = String(new FormData(e.currentTarget).get("email") || "").trim();
    await supabaseBrowser().auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/auth/callback?next=/reset-password` });
    setSent(true); // Same answer either way, so nobody can test which emails have accounts.
  }
  if (sent) return <div className="thanks" role="status"><h2>Check Your Email</h2><p>If there is an account for that address, we sent a link to set a new password.</p></div>;
  return (
    <form className="form" method="post" onSubmit={onSubmit}>
      <h2>Reset Your Password</h2>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <button className="btn btn--main" type="submit" disabled={busy}>Send reset link</button>
      <small><a href="/login">Back to log in</a></small>
    </form>
  );
}

export function ResetForm() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const pw = String(new FormData(e.currentTarget).get("password") || "");
    if (pw.length < 8) { setError("Use at least 8 characters."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    if (error) { setError("This reset link has expired. Ask for a new one."); setBusy(false); return; }
    location.href = "/portal";
  }
  return (
    <form className="form" method="post" onSubmit={onSubmit}>
      <h2>Choose a New Password</h2>
      <label className="field"><span>New password</span><input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn--main" type="submit" disabled={busy}>Save password</button>
    </form>
  );
}
