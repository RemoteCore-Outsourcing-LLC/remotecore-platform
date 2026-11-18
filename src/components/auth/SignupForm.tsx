"use client";
import { useMemo, useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { COUNTRIES, CURRENCIES, countryByName } from "@/lib/geo";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function SignupForm() {
  const [country, setCountry] = useState("");
  const [dial, setDial] = useState("+1");
  const [currency, setCurrency] = useState("USD");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [sentTo, setSentTo] = useState("");
  const dials = useMemo(() => Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), []);

  function pickCountry(name: string) {
    setCountry(name);
    const c = countryByName(name);
    if (c) { setDial(c.dial); setCurrency(c.currency); }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "").trim();
    const err: Record<string, string> = {};
    if (v("full_name").length < 2) err.full_name = "Enter your full name.";
    if (!EMAIL.test(v("email"))) err.email = "Enter a valid email address.";
    if (!countryByName(country)) err.country = "Choose your country from the list.";
    const digits = v("phone").replace(/[^\d]/g, "");
    if (digits.length < 6 || digits.length > 14) err.phone = "Enter your mobile number without the country code.";
    const pay = Number(v("expected_salary"));
    if (!v("expected_salary") || !Number.isFinite(pay) || pay <= 0) err.expected_salary = "Enter the monthly pay you expect, as a number.";
    if (v("password").length < 8) err.password = "Use at least 8 characters.";
    if (f.get("terms") !== "yes") err.terms = "Please accept the terms to continue.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setState("sending");
    const { error } = await supabaseBrowser().auth.signUp({
      email: v("email"),
      password: v("password"),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/portal/profile`,
        data: { role: "job_seeker", full_name: v("full_name"), phone: `${dial} ${digits}`, country, expected_salary: String(pay), salary_currency: currency },
      },
    });
    if (error) {
      setErrors({ form: /registered|exists/i.test(error.message) ? "There is already an account with this email. Try logging in." : error.message });
      setState("idle");
      return;
    }
    setSentTo(v("email"));
    setState("sent");
  }

  if (state === "sent") {
    return (
      <div className="thanks" role="status">
        <h2>Check your email</h2>
        <p>We sent a confirmation link to <b>{sentTo}</b>. Open it to finish creating your account.</p>
        <p className="soft" style={{ fontSize: 14 }}>No email after a few minutes? Check your spam folder.</p>
      </div>
    );
  }

  const fe = (k: string) => errors[k] && <span className="ferr" id={`${k}-err`}>{errors[k]}</span>;
  return (
    <form className="form" method="post" onSubmit={onSubmit} noValidate>
      <h2>Create your account</h2>
      <label className="field"><span>Full name</span><input name="full_name" autoComplete="name" aria-invalid={!!errors.full_name} />{fe("full_name")}</label>
      <label className="field"><span>Email</span><input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} />{fe("email")}</label>
      <label className="field"><span>Country of residence</span>
        <select value={country} onChange={(e) => pickCountry(e.target.value)} aria-invalid={!!errors.country}>
          <option value="" disabled>Choose your country</option>
          {COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}
        </select>{fe("country")}
      </label>
      <div className="field"><span id="phone-l">Mobile number</span>
        <div className="combo">
          <select aria-label="Country dial code" value={dial} onChange={(e) => setDial(e.target.value)}>{dials.map((d) => <option key={d}>{d}</option>)}</select>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-labelledby="phone-l" aria-invalid={!!errors.phone} />
        </div>{fe("phone")}
      </div>
      <div className="field"><span id="pay-l">Expected monthly pay</span>
        <div className="combo">
          <select aria-label="Currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input name="expected_salary" type="number" min="1" step="1" inputMode="numeric" aria-labelledby="pay-l" aria-invalid={!!errors.expected_salary} />
        </div>{fe("expected_salary")}
      </div>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete="new-password" minLength={8} aria-invalid={!!errors.password} /><em className="hint">At least 8 characters.</em>{fe("password")}</label>
      <label className="check"><input type="checkbox" name="terms" value="yes" /><span>I agree to the <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>, and to receive recruitment related emails.</span></label>
      {fe("terms")}
      {errors.form && <p className="err" role="alert">{errors.form}</p>}
      <button className="btn btn--main" type="submit" disabled={state === "sending"}>{state === "sending" ? "Creating your account..." : "Create account"}</button>
      <small>Already have an account? <a href="/login">Log in</a></small>
    </form>
  );
}
