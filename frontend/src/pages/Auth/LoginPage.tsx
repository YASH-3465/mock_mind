import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { login } from "../../lib/api";
import mockmindLogo from "../../assets/mockmind-logo.png";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function submit(e: FormEvent) {
    e.preventDefault();

    setBusy(true);

    try {
      await login(email, password);

      toast.success("Welcome back.");

      navigate("/dashboard");
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ?? "Unable to log in."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">

      {/* =====================================================
          PREMIUM AUTH NAVBAR
          ===================================================== */}

      <nav className="auth-navbar">

        {/* -------------------------------------------------
            LEFT — MOCKMIND BRAND
            ------------------------------------------------- */}

        <Link to="/" className="auth-brand">

          <img
            src={mockmindLogo}
            alt="MockMind"
            className="auth-brand-logo"
          />

          <span className="auth-brand-wordmark">
            <span className="auth-brand-mock">
              MOCK
            </span>

            <span className="auth-brand-mind">
              MIND
            </span>
          </span>

        </Link>


        {/* -------------------------------------------------
            RIGHT — SIGNUP ACTION
            ------------------------------------------------- */}

        <div className="auth-nav-action">

          <span>
            New to Mock Mind?
          </span>

          <Link
            to="/signup"
            className="auth-nav-link"
          >
            Create account
          </Link>

        </div>

      </nav>


      {/* =====================================================
          LEFT — LOGIN CONTENT
          ===================================================== */}

      <section className="auth-panel">

        <div className="auth-content">

          <div className="eyebrow">
            WELCOME BACK
          </div>


          <h1>
            Enter the interview room.
          </h1>


          <p>
            Continue your preparation journey.
          </p>


          {/* -------------------------------------------------
              LOGIN FORM
              ------------------------------------------------- */}

          <form onSubmit={submit}>

            {/* EMAIL */}

            <label>
              Email

              <input
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                type="email"
                required
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>


            {/* PASSWORD */}

            <label>
              Password

              <input
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="primary-btn full"
              disabled={busy}
            >
              {busy
                ? "Signing in…"
                : "Log in"}
            </button>

          </form>


          {/* -------------------------------------------------
              BOTTOM SWITCH
              ------------------------------------------------- */}

          <p className="switch">

            New to Mock Mind?{" "}

            <Link to="/signup">
              Create an account
            </Link>

          </p>

        </div>

      </section>


      {/* =====================================================
          RIGHT — ART PANEL
          ===================================================== */}

      <section className="auth-art">

        <div className="art-grid" />

        <div className="art-quote">

          “Confidence comes from rehearsal.”

          <small>
            — Mock Mind
          </small>

        </div>

      </section>

    </main>
  );
}