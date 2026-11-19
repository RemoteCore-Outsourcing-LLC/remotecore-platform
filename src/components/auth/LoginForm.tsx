"use client";
import { useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { safeNext } from "@/lib/safe-next";

export function LoginForm({ next, linkError, signup = "/register" }: { next?: string; linkError?: boolean; signup?: string }) {
  const [error, setError] = useState(linkError ? "That link has expired or was already used. Log in, or ask for a new link." : "");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError("");
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email: String(f.get("email") || "").trim(), password: String(f.get("password") || "") });
    if (error) {
      setError(/confirm/i.test(error.message) ? "Please confirm your email first. Check your inbox for our link." : "That email and password do not match. Try again or reset your password.");
      setBusy(false);
      return;
    }
    location.href = safeNext(next);
  }

  return (
    <form className="form" method="post" onSubmit={onSubmit}>
      <h2>Log In</h2>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required /></label>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn btn--main" type="submit" disabled={busy}>{busy ? "Logging in..." : "Log in"}</button>
      <small><a href="/forgot-password">Forgot your password?</a> · New here? <a href={signup}>Create an account</a></small>
    </form>
  );
}
