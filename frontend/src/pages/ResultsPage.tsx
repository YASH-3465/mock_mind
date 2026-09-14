import {
  ArrowLeft,
  CheckCircle2,
  Trophy,
} from "lucide-react";

import {
  Link,
  useLocation,
  useParams,
} from "react-router-dom";

import type { InterviewResult } from "../lib/types";

export default function ResultsPage() {
  const { sessionId } = useParams();
  const location = useLocation();

  const result =
    (location.state ?? null) as InterviewResult | null;

  return (
    <main className="app-shell">

      {/* ================================================= */}
      {/* NAVIGATION                                        */}
      {/* ================================================= */}

      <nav className="nav">

        <Link
          to="/dashboard"
          className="brand"
        >
          <span className="brand-mark">
            M
          </span>

          MOCK MIND
        </Link>

        <Link
          to="/dashboard"
          className="ghost-btn"
        >
          <ArrowLeft size={16} />
          Dashboard
        </Link>

      </nav>

      {/* ================================================= */}
      {/* RESULTS                                           */}
      {/* ================================================= */}

      <section className="results">

        <div className="result-hero">

          <div className="eyebrow">
            INTERVIEW COMPLETE / SESSION {sessionId}
          </div>

          <h1>
            That’s the rehearsal.
            <br />
            <span>
              Now see what you can improve.
            </span>
          </h1>

          <p>
            Your answers were evaluated
            question-by-question. Camera and
            voice behavioral signals are
            intentionally left for the next
            analysis layer.
          </p>

        </div>

        {result ? (

          <>

            {/* SCORE GRID */}

            <div className="score-grid">

              <div className="score-card">
                <span>
                  Overall
                </span>

                <strong>
                  {result.overall_score}
                  <small>/10</small>
                </strong>
              </div>

              <div className="score-card">
                <span>
                  Technical
                </span>

                <strong>
                  {result.technical_score}
                  <small>/10</small>
                </strong>
              </div>

              <div className="score-card">
                <span>
                  Communication
                </span>

                <strong>
                  {result.communication_score}
                  <small>/10</small>
                </strong>
              </div>

              <div className="score-card">
                <span>
                  Confidence
                </span>

                <strong>
                  {result.confidence_score}
                  <small>/10</small>
                </strong>
              </div>

            </div>

            {/* SUCCESS */}

            <div className="result-note">

              <Trophy size={20} />

              <div>

                <b>
                  Session completed successfully
                </b>

                <p>
                  {result.evaluated_answers} of{" "}
                  {result.total_questions} answers
                  evaluated.
                </p>

              </div>

              <CheckCircle2 size={20} />

            </div>

          </>

        ) : (

          <div className="result-note">

            <Trophy size={20} />

            <div>

              <b>
                Results could not be loaded.
              </b>

              <p>
                Return to your dashboard and
                open the interview from your
                history again.
              </p>

            </div>

          </div>

        )}

      </section>

    </main>
  );
}