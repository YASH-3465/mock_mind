import {
  ArrowRight,
  FileText,
  LogOut,
  Mic2,
  ShieldCheck,
  History,
  Trophy,
  LoaderCircle,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useEffect, useState } from "react";

import {
  getInterviewHistory,
  logout,
} from "../../lib/api";

import MockMindBrand from "../../components/MockMindBrand";

type InterviewHistoryItem = {
  session_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
  total_questions: number;
  answered_questions: number;
  technical_score: number;
  communication_score: number;
  confidence_score: number;
  overall_score: number;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  useEffect(() => {
  if (window.location.hash === "#history") {
    setTimeout(() => {
      const historySection =
        document.getElementById("history");

      historySection?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  }
}, []);

  const [history, setHistory] = useState<
    InterviewHistoryItem[]
  >([]);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  // --------------------------------------------------
  // LOAD HISTORY
  // --------------------------------------------------

  useEffect(() => {
    async function loadHistory() {
      try {
        const data = await getInterviewHistory();

        setHistory(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "Could not load interview history:",
          error
        );
      } finally {
        setHistoryLoading(false);
      }
    }

    loadHistory();
  }, []);

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  // --------------------------------------------------
  // DATE
  // --------------------------------------------------

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  }

  // --------------------------------------------------
  // OPEN RESULTS
  // --------------------------------------------------

  function openResults(
    interview: InterviewHistoryItem
  ) {
    navigate(
      `/results/${interview.session_id}`,
      {
        state: interview,
      }
    );
  }

  return (
    <main className="app-shell">

      {/* ================================================= */}
      {/* NAVIGATION                                        */}
      {/* ================================================= */}

  <MockMindBrand />

     
      {/* ================================================= */}
      {/* DASHBOARD                                         */}
      {/* ================================================= */}

      <section className="dashboard">

        <div className="dashboard-head">

          <div>

            <div className="eyebrow">
              YOUR INTERVIEW ROOM
            </div>

            <h1>
              Ready when you are.
            </h1>

            <p>
              One resume. One adaptive interview.
              One honest performance report.
            </p>

          </div>

        </div>

        {/* ================================================= */}
        {/* START INTERVIEW                                   */}
        {/* ================================================= */}

        <div className="start-card">

          <div className="start-icon">
            <FileText size={28} />
          </div>

          <div>

            <h2>
              Start a new interview
            </h2>

            <p>
              Upload your latest PDF resume.
              Mock Mind will analyze it and
              generate a tailored question set.
            </p>

            <div className="checks">

              <span>
                <ShieldCheck size={15} />
                Resume-driven questions
              </span>

              <span>
                <Mic2 size={15} />
                Voice-first interaction
              </span>

            </div>

          </div>

          <Link
            to="/resume"
            className="primary-btn"
          >
            Upload resume
            <ArrowRight size={17} />
          </Link>

        </div>

        {/* ================================================= */}
        {/* FLOW                                               */}
        {/* ================================================= */}

        <div className="flow">

          <div>
            <b>01</b>
            <span>Upload</span>
            <small>PDF resume</small>
          </div>

          <div>
            <b>02</b>
            <span>Analyze</span>
            <small>Skills & projects</small>
          </div>

          <div>
            <b>03</b>
            <span>Interview</span>
            <small>Speak naturally</small>
          </div>

          <div>
            <b>04</b>
            <span>Review</span>
            <small>Scores & feedback</small>
          </div>

        </div>

        {/* ================================================= */}
        {/* HISTORY                                           */}
        {/* ================================================= */}

        <section
  id="history"
  className="history-section"
>

          <div className="history-heading">

            <div>

              <div className="eyebrow">
                YOUR PROGRESS
              </div>

              <h2>
                Interview history
              </h2>

              <p>
                Review your previous interview
                performances and track your progress.
              </p>

            </div>

            <div className="history-heading-icon">
              <History size={22} />
            </div>

          </div>

          {/* ----------------------------------------------- */}
          {/* LOADING                                         */}
          {/* ----------------------------------------------- */}

          {historyLoading && (

            <div className="history-state">

              <LoaderCircle
                size={22}
                className="spin"
              />

              <span>
                Loading your interview history...
              </span>

            </div>

          )}

          {/* ----------------------------------------------- */}
          {/* EMPTY                                           */}
          {/* ----------------------------------------------- */}

          {!historyLoading &&
            history.length === 0 && (

              <div className="history-empty">

                <div className="history-empty-icon">
                  <Trophy size={22} />
                </div>

                <div>

                  <h3>
                    No interviews yet
                  </h3>

                  <p>
                    Complete your first mock interview
                    and your results will appear here.
                  </p>

                </div>

              </div>

            )}

          {/* ----------------------------------------------- */}
          {/* HISTORY CARDS                                   */}
          {/* ----------------------------------------------- */}

          {!historyLoading &&
            history.length > 0 && (

              <div className="history-list">

                {history.map((interview) => (

                  <article
                    className="history-card"
                    key={interview.session_id}
                  >

                    {/* TOP */}

                    <div className="history-card-top">

                      <div className="history-session">

                        <div className="history-session-icon">
                          <Trophy size={19} />
                        </div>

                        <div>

                          <h3>
                            Interview #{interview.session_id}
                          </h3>

                          <div className="history-date">

                            <CalendarDays
                              size={14}
                            />

                            <span>
                              {formatDate(
                                interview.completed_at ??
                                  interview.started_at
                              )}
                            </span>

                            <span className="history-dot">
                              •
                            </span>

                            <span>
                              {formatTime(
                                interview.completed_at ??
                                  interview.started_at
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                      <span className="history-status">
                        {interview.status}
                      </span>

                    </div>

                    {/* SCORE */}

                    <div className="history-score-row">

                      <div className="history-overall">

                        <span>
                          Overall score
                        </span>

                        <strong>
                          {interview.overall_score.toFixed(1)}
                          <small>
                            /10
                          </small>
                        </strong>

                      </div>

                      <div className="history-metrics">

                        <div>
                          <span>
                            Technical
                          </span>

                          <strong>
                            {interview.technical_score.toFixed(
                              1
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Communication
                          </span>

                          <strong>
                            {interview.communication_score.toFixed(
                              1
                            )}
                          </strong>
                        </div>

                        <div>
                          <span>
                            Confidence
                          </span>

                          <strong>
                            {interview.confidence_score.toFixed(
                              1
                            )}
                          </strong>
                        </div>

                      </div>

                    </div>

                    {/* BOTTOM */}

                    <div className="history-card-bottom">

                      <span>
                        {interview.answered_questions}
                        {" / "}
                        {interview.total_questions}
                        {" questions answered"}
                      </span>

                      <button
                        className="history-view-btn"
                        onClick={() =>
                          openResults(interview)
                        }
                      >
                        View results
                        <ChevronRight size={16} />
                      </button>

                    </div>

                  </article>

                ))}

              </div>

            )}

        </section>

      </section>

    </main>
  );
}