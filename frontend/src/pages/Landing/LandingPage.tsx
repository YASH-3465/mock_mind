import { ArrowRight, BrainCircuit, Camera, FileText, Mic2, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import MockMindBrand from "../../components/MockMindBrand";
import mockmindLogo from "../../assets/mockmind-logo.png";

export default function LandingPage() {
  return (
    <main className="landing">
<nav className="nav">
  {/* LEFT — MOCKMIND BRAND */}
  <Link
    to="/"
    className="mockmind-brand"
    aria-label="MockMind"
  >
    <img
      src={mockmindLogo}
      alt="MockMind"
      className="mockmind-brand-logo"
    />

    <span className="mockmind-wordmark">
      <span className="mock">MOCK</span>
      <span className="mind">MIND</span>
    </span>
  </Link>

  {/* RIGHT — AUTH ACTIONS */}
  <div className="nav-actions">
    <Link
      to="/login"
      className="ghost-btn"
    >
      Log in
    </Link>

    <Link
      to="/signup"
      className="primary-btn"
    >
      Get started
      <ArrowRight size={17} />
    </Link>
  </div>
</nav>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15}/> AI interview simulator</div>
          <h1>Practice interviews like you’re <span>already in the room.</span></h1>
          <p>Upload your resume. Mock Mind builds a resume-specific interview, speaks the questions aloud, listens to your answers, and gives you a structured performance report.</p>
          <div className="hero-actions">
            <Link to="/signup" className="primary-btn large">Start an interview <ArrowRight size={19}/></Link>
            <span className="microcopy">No typing-only interview flow.</span>
          </div>
        </div>
        <div className="hero-card">
          <div className="live-pill"><span/> LIVE INTERVIEW</div>
          <div className="orb"><BrainCircuit size={54}/></div>
          <div className="ai-label">MOCK MIND AI</div>
          <div className="question">“Tell me about a significant challenge you faced in one of your projects.”</div>
          <div className="wave"><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
          <div className="status-row"><span><Mic2 size={15}/> Listening</span><span><Camera size={15}/> Camera ready</span></div>
        </div>
      </section>

      <section className="feature-strip">
        {[
          [FileText, "Resume-driven", "Questions built from your actual profile."],
          [Mic2, "Voice-first", "AI asks. You answer naturally."],
          [Camera, "Video-ready", "Camera signals can power future confidence analysis."],
        ].map(([Icon, title, body]) => (
          <div className="feature" key={String(title)}>
            <div className="icon-box"><Icon size={19}/></div>
            <div><b>{String(title)}</b><p>{String(body)}</p></div>
          </div>
        ))}
      </section>
    </main>
  );
}
