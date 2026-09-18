import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Trophy,
} from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { getInterviewResult } from "../lib/api";
import type { InterviewResult } from "../lib/types";
import MockMindBrand from "../components/MockMindBrand";

export default function ResultsPage() {
  const { sessionId } = useParams();
  const location = useLocation();

  const [result, setResult] = useState<InterviewResult | null>(
    (location.state ?? null) as InterviewResult | null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openQuestion, setOpenQuestion] = useState<number | null>(1);

  useEffect(() => {
    async function loadResult() {
      if (!sessionId) {
        setError("Interview session not found.");
        setLoading(false);
        return;
      }

      try {
        const data = await getInterviewResult(Number(sessionId));
        setResult(data);
      } catch (err: any) {
        setError(
          err?.response?.data?.detail ??
            "Unable to load interview results."
        );
      } finally {
        setLoading(false);
      }
    }

    loadResult();
  }, [sessionId]);

  function toggleQuestion(questionNumber: number) {
    setOpenQuestion((current) =>
      current === questionNumber ? null : questionNumber
    );
  }

  if (loading) {
    return (
      <main className="app-shell">
        <MockMindBrand />

        <section className="results">
          <div className="result-loading">
            <div className="result-loading-dot" />
            <p>Loading your interview analysis...</p>
          </div>
        </section>
      </main>
    );
  }

  if (error || !result) {
    return (
      <main className="app-shell">
        <MockMindBrand />

        <section className="results">
          <div className="result-error">
            <Trophy size={28} />
            <h2>Results unavailable</h2>
            <p>{error || "No interview result was found."}</p>
            <Link to="/dashboard" className="primary-btn">
              Back to Dashboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <MockMindBrand />

      <section className="results detailed-results">
        {/* HERO */}
        <div className="result-hero detailed-result-hero">
          <div className="eyebrow">
            INTERVIEW COMPLETE / SESSION {result.session_id}
          </div>

          <h1>
            Your rehearsal,
            <br />
            <span>decoded.</span>
          </h1>

          <p>
            Every answer was evaluated individually for technical knowledge,
            communication, and confidence.
          </p>
        </div>

        {/* OVERALL SCORE */}
        <div className="overall-result-card">
          <div className="overall-score-ring">
            <span>OVERALL</span>
            <strong>{result.overall_score}</strong>
            <small>/10</small>
          </div>

          <div className="overall-result-info">
            <div className="overall-result-label">
              <CheckCircle2 size={18} />
              Interview completed successfully
            </div>

            <h2>
              {result.evaluated_answers} of {result.total_questions} answers
              evaluated
            </h2>

            <p>
              Your overall score combines your technical performance and
              communication across the interview.
            </p>
          </div>
        </div>

        {/* SCORE CARDS */}
        <div className="detailed-score-grid">
          <ScoreCard
            label="Technical"
            value={result.technical_score}
            description="Knowledge & accuracy"
          />

          <ScoreCard
            label="Communication"
            value={result.communication_score}
            description="Clarity & structure"
          />

          <ScoreCard
            label="Confidence"
            value={result.confidence_score}
            description="Current language estimate"
          />
        </div>

        {/* SESSION INFO */}
        <div className="result-session-meta">
          <div>
            <span>QUESTIONS</span>
            <strong>
              {result.answered_questions}/{result.total_questions}
            </strong>
          </div>

          <div>
            <span>STATUS</span>
            <strong>{result.status}</strong>
          </div>

          <div>
            <span>COMPLETED</span>
            <strong>
              {result.completed_at
                ? new Date(result.completed_at).toLocaleString()
                : "—"}
            </strong>
          </div>
        </div>

        {/* QUESTION BREAKDOWN */}
        <div className="question-breakdown">
          <div className="section-heading">
            <div>
              <div className="eyebrow">QUESTION BY QUESTION</div>
              <h2>Answer breakdown</h2>
            </div>

            <span>
              {result.questions.length} questions
            </span>
          </div>

          <div className="question-result-list">
            {result.questions.map((question) => {
              const isOpen =
                openQuestion === question.question_number;

              return (
                <div
                  className={`question-result-card ${
                    isOpen ? "open" : ""
                  }`}
                  key={question.question_id}
                >
                  <button
                    className="question-result-header"
                    onClick={() =>
                      toggleQuestion(question.question_number)
                    }
                  >
                    <div className="question-result-number">
                      <span>
                        Q{String(question.question_number).padStart(2, "0")}
                      </span>
                    </div>

                    <div className="question-result-title">
                      <span className="question-result-category">
                        QUESTION {question.question_number}
                      </span>

                      <h3>{question.question}</h3>
                    </div>

                    <div className="question-result-score">
                      <strong>{question.overall_score}</strong>
                      <small>/10</small>
                    </div>

                    <ChevronDown
                      size={19}
                      className="question-result-chevron"
                    />
                  </button>

                  {isOpen && (
                    <div className="question-result-body">
                      {/* ANSWER */}
                      <div className="answer-section">
                        <div className="answer-section-title">
                          <span>YOUR ANSWER</span>

                          {question.answer_duration !== null && (
                            <span className="answer-duration">
                              <Clock3 size={14} />
                              {formatDuration(
                                question.answer_duration
                              )}
                            </span>
                          )}
                        </div>

                        <div className="answer-box">
                          {question.answer ? (
                            <p>{question.answer}</p>
                          ) : (
                            <p className="empty-answer">
                              No answer recorded.
                            </p>
                          )}
                        </div>
                      </div>

                      {/* SCORES */}
                      <div className="question-score-row">
                        <MiniScore
                          label="Technical"
                          value={question.technical_score}
                        />

                        <MiniScore
                          label="Communication"
                          value={question.communication_score}
                        />

                        <MiniScore
                          label="Confidence"
                          value={question.confidence_score}
                        />
                      </div>

                      {/* FEEDBACK */}
                      <div className="feedback-section">
                        <div className="answer-section-title">
                          <span>AI FEEDBACK</span>
                        </div>

                        <div className="feedback-box">
  {question.feedback ? (
    <FeedbackContent feedback={question.feedback} />
  ) : (
    <p className="empty-answer">
      No feedback available.
    </p>
  )}
</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER NOTE */}
        <div className="result-final-note">
          <Trophy size={20} />

          <div>
            <strong>Keep rehearsing.</strong>
            <p>
              Camera and voice behavioral signals are intentionally
              reserved for the next analysis layer.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function ScoreCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="detailed-score-card">
      <div className="detailed-score-top">
        <span>{label}</span>
        <strong>
          {value}
          <small>/10</small>
        </strong>
      </div>

      <div className="score-progress">
        <div
          style={{
            width: `${Math.max(0, Math.min(100, value * 10))}%`,
          }}
        />
      </div>

      <p>{description}</p>
    </div>
  );
}

function MiniScore({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="mini-score">
      <span>{label}</span>

      <div className="mini-score-value">
        <strong>{value}</strong>
        <small>/10</small>
      </div>
    </div>
  );
}

function formatDuration(seconds: number) {
  const rounded = Math.round(seconds);

  const minutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function FeedbackContent({ feedback }: { feedback: string }) {
  try {
    const parsed = JSON.parse(feedback);

    return (
      <div className="structured-feedback">
        {parsed.feedback && (
          <div className="feedback-main">
            <p>{parsed.feedback}</p>
          </div>
        )}

        {Array.isArray(parsed.strengths) && parsed.strengths.length > 0 && (
          <div className="feedback-list">
            <h4>Strengths</h4>

            <ul>
              {parsed.strengths.map(
                (strength: string, index: number) => (
                  <li key={index}>{strength}</li>
                )
              )}
            </ul>
          </div>
        )}

        {Array.isArray(parsed.improvements) &&
          parsed.improvements.length > 0 && (
            <div className="feedback-list">
              <h4>Improvements</h4>

              <ul>
                {parsed.improvements.map(
                  (improvement: string, index: number) => (
                    <li key={index}>{improvement}</li>
                  )
                )}
            </ul>
          </div>
        )}
      </div>
    );
  } catch {
    // Fallback for older feedback that isn't JSON
    return <p>{feedback}</p>;
  }
}