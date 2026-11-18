"use client";
import { useMemo, useState, type FormEvent } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { COUNTRIES, countryByName } from "@/lib/geo";
import { INDUSTRIES, cleanWebsite } from "@/lib/employer";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function EmployerSignupForm() {
  const [country, setCountry] = useState("");
  const [dial, setDial] = useState("+1");
  const [desc, setDesc] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [sentTo, setSentTo] = useState("");
  const dials = useMemo(() => Array.from(new Set(COUNTRIES.map((c) => c.dial))).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))), []);

  function pickCountry(name: string) {
    setCountry(name);
    const c = countryByName(name);
    if (c) setDial(c.dial);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const v = (k: string) => String(f.get(k) || "").trim();
    const err: Record<string, string> = {};
    if (v("company").length < 2) err.company = "Enter your company name.";
    if (v("full_name").length < 2) err.full_name = "Enter the name of the contact person.";
    if (!EMAIL.test(v("email"))) err.email = "Enter a valid business email address.";
    const digits = v("phone").replace(/[^\d]/g, "");
    if (digits.length < 6 || digits.length > 14) err.phone = "Enter the phone number without the country code.";
    if (!countryByName(country)) err.country = "Choose the country from the list.";
    const site = cleanWebsite(v("website"));
    if (site === null) err.website = "Check the website address, for example yourcompany.com.";
    if (!v("industry")) err.industry = "Choose your industry.";
    if (desc.trim().length < 20) err.description = "Tell us a little about your company (at least 20 characters).";
    if (v("password").length < 8) err.password = "Use at least 8 characters.";
    if (f.get("terms") !== "yes") err.terms = "Please accept the terms to continue.";
    setErrors(err);
    if (Object.keys(err).length) return;

    setState("sending");
    const { error } = await supabaseBrowser().auth.signUp({
      email: v("email"),
      password: v("password"),
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=/portal`,
        data: {
          role: "employer", full_name: v("full_name"), company: v("company"), phone: `${dial} ${digits}`, country,
          website: site || "", industry: v("industry"), description: desc.trim().slice(0, 2000),
        },
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
        <p>We sent a confirmation link to <b>{sentTo}</b>. Open it to confirm your email.</p>
        <p>Our team then reviews your company account. We will email you as soon as it is approved.</p>
        <p className="soft" style={{ fontSize: 14 }}>No email after a few minutes? Check your spam folder.</p>
      </div>
    );
  }

  const fe = (k: string) => errors[k] && <span className="ferr" id={`${k}-err`}>{errors[k]}</span>;
  return (
    <form className="form" onSubmit={onSubmit} noValidate>
      <h2>Create your company account</h2>
      <label className="field"><span>Company name</span><input name="company" autoComplete="organization" aria-invalid={!!errors.company} />{fe("company")}</label>
      <label className="field"><span>Contact person</span><input name="full_name" autoComplete="name" aria-invalid={!!errors.full_name} />{fe("full_name")}</label>
      <label className="field"><span>Business email</span><input name="email" type="email" autoComplete="email" aria-invalid={!!errors.email} /><em className="hint">You will log in with this email.</em>{fe("email")}</label>
      <label className="field"><span>Country of registration or operation</span>
        <select value={country} onChange={(e) => pickCountry(e.target.value)} aria-invalid={!!errors.country}>
          <option value="" disabled>Choose a country</option>
          {COUNTRIES.map((c) => <option key={c.code}>{c.name}</option>)}
        </select>{fe("country")}
      </label>
      <div className="field"><span id="phone-l">Business phone</span>
        <div className="combo">
          <select aria-label="Country dial code" value={dial} onChange={(e) => setDial(e.target.value)}>{dials.map((d) => <option key={d}>{d}</option>)}</select>
          <input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" aria-labelledby="phone-l" aria-invalid={!!errors.phone} />
        </div>{fe("phone")}
      </div>
      <label className="field"><span>Company website <em className="hint">optional</em></span><input name="website" inputMode="url" autoComplete="url" placeholder="yourcompany.com" aria-invalid={!!errors.website} />{fe("website")}</label>
      <label className="field"><span>Industry or business sector</span>
        <select name="industry" defaultValue="" aria-invalid={!!errors.industry}>
          <option value="" disabled>Choose an industry</option>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </select>{fe("industry")}
      </label>
      <label className="field"><span>About your company</span>
        <textarea name="description" rows={4} value={desc} onChange={(e) => setDesc(e.target.value.slice(0, 2000))} placeholder="What you do, and the kind of remote roles you hire for." aria-invalid={!!errors.description} />
        {fe("description")}
      </label>
      <label className="field"><span>Password</span><input name="password" type="password" autoComplete="new-password" minLength={8} aria-invalid={!!errors.password} /><em className="hint">At least 8 characters.</em>{fe("password")}</label>
      <label className="check"><input type="checkbox" name="terms" value="yes" /><span>I agree to the <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a> on behalf of my company.</span></label>
      {fe("terms")}
      {errors.form && <p className="err" role="alert">{errors.form}</p>}
      <button className="btn btn--main" type="submit" disabled={state === "sending"}>{state === "sending" ? "Creating your account..." : "Create company account"}</button>
      <small>Already have an account? <a href="/login">Log in</a></small>
    </form>
  );
}
