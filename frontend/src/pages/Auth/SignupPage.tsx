import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signup } from "../../lib/api";
import mockmindLogo from "../../assets/mockmind-logo.png";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);

    try {
      await signup(name, email, password);

      toast.success("Account created.");
      navigate("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ??
          "Unable to create your account."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">

      {/* AUTH NAVBAR */}
      <nav className="auth-navbar">

        {/* MOCKMIND BRAND */}
        <Link to="/" className="auth-brand">
          <img
            src={mockmindLogo}
            alt="MockMind"
            className="auth-brand-logo"
          />

          <span className="auth-brand-wordmark">
            <span className="auth-brand-mock">MOCK</span>
            <span className="auth-brand-mind">MIND</span>
          </span>
        </Link>

        {/* NAV ACTION */}
        <div className="auth-nav-action">
          <span>Already have an account?</span>

          <Link
            to="/login"
            className="auth-nav-link"
          >
            Log in
          </Link>
        </div>

      </nav>

      {/* LEFT */}
      <section className="auth-panel">

        <div className="auth-content">

          <div className="eyebrow">
            GET STARTED
          </div>

          <h1>
            Build your interview advantage.
          </h1>

          <p>
            Create your Mock Mind account and start
            practicing with AI-powered interviews.
          </p>

          <form onSubmit={submit}>

            <label>
              Name

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                required
                placeholder="Your name"
                autoComplete="name"
              />
            </label>

            <label>
              Email

              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Password

              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </label>

            <button
              type="submit"
              className="primary-btn full"
              disabled={busy}
            >
              {busy
                ? "Creating account…"
                : "Create account"}
            </button>

          </form>

          <p className="switch">
            Already have an account?{" "}
            <Link to="/login">
              Log in
            </Link>
          </p>

        </div>

      </section>

      {/* RIGHT ART */}
      <section className="auth-art">

        <div className="art-grid" />

        <div className="art-quote">
          “The best interview is the one you've
          already practiced.”

          <small>— Mock Mind</small>
        </div>

      </section>

    </main>
  );
}