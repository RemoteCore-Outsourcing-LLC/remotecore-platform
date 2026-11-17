import type { Metadata } from "next";

export const metadata: Metadata = { title: "Log in", robots: { index: false } };

// TODO (Supabase step): real email + password login, then send each role to its dashboard.
export default function Login() {
  return (
    <section className="phero">
      <div className="wrap split split--top">
        <div>
          <p className="eyebrow">Log in</p>
          <h1>Welcome back.</h1>
          <p className="lede">Job seekers, employers and the RemoteCore team all log in here.</p>
        </div>
        <div className="panel">
          <h2>Log in</h2>
          <form className="form" action="#" aria-describedby="login-soon">
            <label className="field"><span>Email</span><input type="email" name="email" autoComplete="email" disabled /></label>
            <label className="field"><span>Password</span><input type="password" name="password" autoComplete="current-password" disabled /></label>
            <button className="btn btn--main" type="button" disabled>Log in</button>
            <small id="login-soon">Accounts open soon. New here? <a href="/register">Create an account</a>.</small>
          </form>
        </div>
      </div>
    </section>
  );
}
