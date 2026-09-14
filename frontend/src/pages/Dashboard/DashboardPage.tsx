import { ArrowRight, FileText, LoaderCircle, LogOut, Mic2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, logout } from "../../lib/api";

type InterviewHistoryItem = {
  session_id: number;
  resume_analysis_id: number;
  status: string;
  overall_score: number | null;
  started_at: string | null;
  completed_at: string | null;
  question_count: number;
  duration_seconds: number | null;
};

type InterviewHistoryResponse = {
  interviews: InterviewHistoryItem[];
  total: number;
};

function formatDate(value: string | null) {
  if (!value) return "Unknown date";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [history, setHistory] = useState<InterviewHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      try {
        const response = await api.get<InterviewHistoryResponse>(
          "/interview-history/"
        );

        if (active) setHistory(response.data.interviews);
      } catch (error: any) {
        if (active) {
          toast.error(
            error?.response?.data?.detail ??
              "Could not load interview history."
          );
        }
      } finally {
        if (active) setLoadingHistory(false);
      }
    }

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <nav className="nav">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark">M</span> MOCK MIND
        </Link>
        <button
          className="ghost-btn"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut size={16} /> Log out
        </button>
      </nav>

      <section className="dashboard">
        <div className="dashboard-head">
          <div>
            <div className="eyebrow">YOUR INTERVIEW ROOM</div>
            <h1>Ready when you are.</h1>
            <p>
              One resume. One adaptive interview. One honest performance report.
            </p>
          </div>
        </div>

        <div className="start-card">
          <div className="start-icon">
            <FileText size={28} />
          </div>
          <div>
            <h2>Start a new interview</h2>
            <p>
              Upload your latest PDF resume. Mock Mind will analyze it and
              generate a tailored question set.
            </p>
            <div className="checks">
              <span>
                <ShieldCheck size={15} /> Resume-driven questions
              </span>
              <span>
                <Mic2 size={15} /> Voice-first interaction
              </span>
            </div>
          </div>
          <Link to="/resume" className="primary-btn">
            Upload resume <ArrowRight size={17} />
          </Link>
        </div>

        <div className="flow">
          <div><b>01</b><span>Upload</span><small>PDF resume</small></div>
          <div><b>02</b><span>Analyze</span><small>Skills &amp; projects</small></div>
          <div><b>03</b><span>Interview</span><small>Speak naturally</small></div>
          <div><b>04</b><span>Review</span><small>Scores &amp; feedback</small></div>
        </div>

        <section className="history-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow">YOUR PROGRESS</div>
              <h2>Interview history</h2>
            </div>
            {history.length > 0 && <span>{history.length} completed</span>}
          </div>

          {loadingHistory ? (
            <div className="history-empty">
              <LoaderCircle className="spin" size={24} />
              <span>Loading your previous interviews…</span>
            </div>
          ) : history.length === 0 ? (
            <div className="history-empty">
              <FileText size={24} />
              <div>
                <strong>No completed interviews yet.</strong>
                <p>Your completed interview reports will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="history-list">
              {history.map((item) => (
                <article className="history-card" key={item.session_id}>
                  <div className="history-main">
                    <div>
                      <span className="history-badge">COMPLETED</span>
                      <h3>Mock Interview</h3>
                      <p>{formatDate(item.completed_at)}</p>
                    </div>
                    <div className="history-score">
                      <span>Overall</span>
                      <strong>
                        {item.overall_score !== null
                          ? `${item.overall_score.toFixed(1)}/10`
                          : "—"}
                      </strong>
                    </div>
                  </div>

                  <div className="history-meta">
                    <span>{item.question_count} questions</span>
                    <span>{formatDuration(item.duration_seconds)}</span>
                  </div>

                  <button
                    className="secondary-btn"
                    onClick={() => navigate(`/results/${item.session_id}`)}
                  >
                    View results <ArrowRight size={16} />
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
