import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CameraOff,
  Check,
  LoaderCircle,
  Mic,
  MicOff,
  Send,
  Volume2,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { completeInterview, saveAnswer } from "../../lib/api";
import type { InterviewData, Question } from "../../lib/types";

type SpeechRecognitionCtor = new () => any;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export default function InterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startedAt = useRef(Date.now());

  const recognitionRef = useRef<any>(null);

  /*
   * Controls whether speech recognition should
   * continue running.
   */
  const shouldListenRef = useRef(false);

  /*
   * Stores all final speech transcripts.
   *
   * This is important because Chrome can automatically
   * terminate SpeechRecognition even when the candidate
   * is still speaking.
   */
  const finalTranscriptRef = useRef("");

  const question = questions[index];

  // --------------------------------------------------
  // LOAD QUESTIONS
  // --------------------------------------------------

  useEffect(() => {
    if (!sessionId) return;

    const raw = localStorage.getItem("mockmind_questions");

    if (!raw) return;

    try {
      const data = JSON.parse(raw) as InterviewData;

      if (String(data.session_id) === sessionId) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error("Could not load interview questions:", error);
    }
  }, [sessionId]);

  // --------------------------------------------------
  // INTERVIEW TIMER
  // --------------------------------------------------

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - startedAt.current) / 1000)
      );
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // --------------------------------------------------
  // CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      recognitionRef.current?.stop();

      speechSynthesis.cancel();
    };
  }, []);

  // --------------------------------------------------
  // SPEAK QUESTION BEFORE INTERVIEW START
  // --------------------------------------------------

  useEffect(() => {
    if (question && !started) {
      speak(question.question);
    }
  }, [question, started]);

  // --------------------------------------------------
  // CAMERA
  // --------------------------------------------------

  async function prepareCamera() {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setCameraOn(true);
    } catch (error) {
      console.error("Camera permission error:", error);

      setCameraError(
        "Camera permission was not granted. You can still continue with voice/text."
      );
    }
  }

  // --------------------------------------------------
  // TEXT TO SPEECH
  // --------------------------------------------------

  function speak(text: string) {
    setSpeaking(true);

    /*
     * Stop any previous speech.
     */
    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.rate = 0.96;
    utterance.pitch = 1;

    utterance.onend = () => {
      setSpeaking(false);

      /*
       * Once the AI finishes asking the question,
       * automatically start listening.
       */
      if (started && !saving) {
        startListening();
      }
    };

    utterance.onerror = () => {
      setSpeaking(false);
    };

    speechSynthesis.speak(utterance);
  }

  // --------------------------------------------------
  // START SPEECH RECOGNITION
  // --------------------------------------------------

  function startListening() {
    const C =
      window.SpeechRecognition ??
      window.webkitSpeechRecognition;

    if (!C) {
      toast.error(
        "Speech recognition is not supported in this browser."
      );

      setListening(false);
      return;
    }

    /*
     * Prevent multiple recognition sessions from
     * running at the same time.
     */
    if (
      shouldListenRef.current &&
      recognitionRef.current
    ) {
      return;
    }

    shouldListenRef.current = true;

    const startRecognition = () => {
      if (!shouldListenRef.current) {
        return;
      }

      const recognition = new C();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      // ----------------------------------------------
      // RECOGNITION STARTED
      // ----------------------------------------------

      recognition.onstart = () => {
        setListening(true);
      };

      // ----------------------------------------------
      // SPEECH RESULT
      // ----------------------------------------------

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const transcript =
            event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            /*
             * Save final transcript permanently.
             *
             * This survives recognition restarts.
             */
            finalTranscriptRef.current +=
              transcript + " ";
          } else {
            interimTranscript += transcript;
          }
        }

        /*
         * Show both finalized and currently spoken text.
         */
        setAnswer(
          finalTranscriptRef.current +
            interimTranscript
        );
      };

      // ----------------------------------------------
      // RECOGNITION ERROR
      // ----------------------------------------------

      recognition.onerror = (event: any) => {
        console.log(
          "Speech recognition error:",
          event.error
        );

        /*
         * These are common browser interruptions
         * and don't require an error message.
         */
        if (
          event.error === "no-speech" ||
          event.error === "aborted"
        ) {
          return;
        }

        if (event.error === "not-allowed") {
          shouldListenRef.current = false;
          setListening(false);

          toast.error(
            "Microphone permission was denied."
          );
        }
      };

      // ----------------------------------------------
      // RECOGNITION ENDED
      // ----------------------------------------------

      recognition.onend = () => {
        setListening(false);

        /*
         * Chrome sometimes automatically ends
         * SpeechRecognition.
         *
         * If the candidate is still answering,
         * automatically restart it.
         */
        if (shouldListenRef.current) {
          setTimeout(() => {
            if (shouldListenRef.current) {
              startRecognition();
            }
          }, 300);
        }
      };

      recognitionRef.current = recognition;

      try {
        recognition.start();
      } catch (error) {
        console.log(
          "Recognition start error:",
          error
        );
      }
    };

    startRecognition();
  }

  // --------------------------------------------------
  // STOP SPEECH RECOGNITION
  // --------------------------------------------------

  function stopListening() {
    shouldListenRef.current = false;

    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    setListening(false);
  }

  // --------------------------------------------------
  // BEGIN INTERVIEW
  // --------------------------------------------------

  function begin() {
    setStarted(true);

    startedAt.current = Date.now();

    /*
     * Prepare camera and microphone.
     */
    prepareCamera();

    /*
     * Give React a moment to update the UI
     * before speaking the first question.
     */
    setTimeout(() => {
      if (question) {
        speak(question.question);
      }
    }, 350);
  }

  // --------------------------------------------------
  // SUBMIT ANSWER
  // --------------------------------------------------

  async function submit() {
    if (
      !question ||
      !sessionId ||
      !answer.trim()
    ) {
      return;
    }

    setSaving(true);

    /*
     * Stop microphone before saving.
     */
    stopListening();

    /*
     * Stop question audio if still playing.
     */
    speechSynthesis.cancel();

    try {
      // --------------------------------------------
      // SAVE ANSWER TO DATABASE
      // --------------------------------------------

      await saveAnswer({
        session_id: Number(sessionId),
        question_number:
          question.question_number,
        answer_text: answer.trim(),
        answer_duration: Math.max(1, elapsed),
      });

      /*
       * IMPORTANT:
       *
       * We DO NOT call evaluateAnswer() here.
       *
       * The candidate's answer is only saved.
       *
       * This prevents one Gemini request per answer.
       */

      // --------------------------------------------
      // FINAL QUESTION
      // --------------------------------------------

      if (index === questions.length - 1) {
        /*
         * The final answer has already been saved.
         *
         * completeInterview() will:
         *
         * 1. Check all answers
         * 2. Call Gemini ONCE
         * 3. Evaluate all answers together
         * 4. Save all scores
         * 5. Calculate final averages
         */
        const result = await completeInterview(
          Number(sessionId)
        );

        /*
         * If backend reports an error, don't
         * navigate to the results page.
         */
        if (result?.error) {
          toast.error(
            result.reason ??
              result.error ??
              "Interview could not be completed."
          );

          return;
        }

        navigate(`/results/${sessionId}`, {
          state: result,
        });

        return;
      }

      // --------------------------------------------
      // MOVE TO NEXT QUESTION
      // --------------------------------------------

      finalTranscriptRef.current = "";

      setAnswer("");

      setIndex((currentIndex) => currentIndex + 1);

      /*
       * Speak next question.
       */
      setTimeout(() => {
        const nextQuestion =
          questions[index + 1];

        if (nextQuestion) {
          speak(nextQuestion.question);
        }
      }, 350);
    } catch (err: any) {
      console.error(
        "Interview answer submission error:",
        err
      );

      toast.error(
        err?.response?.data?.detail ??
          err?.response?.data?.reason ??
          "Could not save this answer."
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (!question) {
    return (
      <main className="loading-screen">
        <LoaderCircle
          className="spin"
          size={28}
        />

        <p>
          Loading your interview room…
        </p>
      </main>
    );
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <main className="interview-shell">

      {/* -------------------------------------------- */}
      {/* TOP BAR                                      */}
      {/* -------------------------------------------- */}

      <header className="interview-top">

        <div className="brand">
          <span className="brand-mark">
            M
          </span>

          MOCK MIND
        </div>

        <div className="progress-text">
          QUESTION {index + 1} /{" "}
          {questions.length}
        </div>

        <div className="timer">
          {String(
            Math.floor(elapsed / 60)
          ).padStart(2, "0")}
          :
          {String(
            elapsed % 60
          ).padStart(2, "0")}
        </div>

      </header>

      {/* -------------------------------------------- */}
      {/* MAIN INTERVIEW GRID                          */}
      {/* -------------------------------------------- */}

      <div className="interview-grid">

        {/* ------------------------------------------ */}
        {/* AI INTERVIEWER                            */}
        {/* ------------------------------------------ */}

        <aside className="interviewer-card">

          <div className="ai-avatar">
            <div className="ai-core" />
          </div>

          <div className="live-pill">
            <span />
            AI INTERVIEWER
          </div>

          <h2>
            Mock Mind
          </h2>

          <p>
            {speaking
              ? "Asking your question…"
              : listening
              ? "Listening to you…"
              : "Take your time."}
          </p>

          <div className="voice-bars">
            {[1, 2, 3, 4, 5, 6, 7].map(
              (n) => (
                <i
                  className={
                    speaking || listening
                      ? "active"
                      : ""
                  }
                  key={n}
                />
              )
            )}
          </div>

        </aside>

        {/* ------------------------------------------ */}
        {/* CONVERSATION                              */}
        {/* ------------------------------------------ */}

        <section className="conversation">

          <div className="question-meta">

            <span>
              {question.category}
            </span>

            <span>
              {question.difficulty}
            </span>

          </div>

          <h1>
            {question.question}
          </h1>

          {/* ANSWER AREA */}

          <div className="answer-area">

            <div className="answer-head">

              <span>
                Your answer
              </span>

              <span>
                {answer.length} chars
              </span>

            </div>

            {/* -------------------------------------- */}
            {/* SINGLE TEXTAREA                         */}
            {/* -------------------------------------- */}

            <textarea
              value={answer}
              onChange={(e) =>
                setAnswer(e.target.value)
              }
              placeholder="Speak naturally. Your transcript will appear here…"
            />

            {/* -------------------------------------- */}
            {/* ANSWER CONTROLS                        */}
            {/* -------------------------------------- */}

            <div className="answer-tools">

              <button
                className={
                  listening
                    ? "tool-btn active"
                    : "tool-btn"
                }
                onClick={() =>
                  listening
                    ? stopListening()
                    : startListening()
                }
                disabled={saving}
              >

                {listening ? (
                  <MicOff size={17} />
                ) : (
                  <Mic size={17} />
                )}

                {listening
                  ? "Stop listening"
                  : "Use microphone"}

              </button>

              <button
                className="tool-btn"
                onClick={() =>
                  speak(question.question)
                }
                disabled={
                  speaking || saving
                }
              >

                <Volume2 size={17} />

                Repeat

              </button>

              <button
                className="send-btn"
                onClick={submit}
                disabled={
                  saving ||
                  !answer.trim()
                }
              >

                {saving ? (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                ) : (
                  <Send size={17} />
                )}

                {index === questions.length - 1
                  ? "Finish interview"
                  : "Submit answer"}

              </button>

            </div>

            {/* -------------------------------------- */}
            {/* HELP TEXT                              */}
            {/* -------------------------------------- */}

            <p className="skip-note">
              If you genuinely don’t know, say
              “Sorry, I don’t know the answer.”
              It will be recorded and evaluated as
              part of the interview.
            </p>

          </div>

        </section>

        {/* ------------------------------------------ */}
        {/* CAMERA                                    */}
        {/* ------------------------------------------ */}

        <aside className="camera-card">

          <div className="camera-head">

            <span>
              CAMERA
            </span>

            <span
              className={
                cameraOn
                  ? "camera-status on"
                  : "camera-status"
              }
            >
              {cameraOn
                ? "LIVE"
                : "OFF"}
            </span>

          </div>

          <div className="video-wrap">

            {cameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
              />
            ) : (
              <div className="camera-off">

                <CameraOff size={28} />

                <span>
                  {cameraError ||
                    "Camera is off"}
                </span>

                <button
                  className="ghost-btn"
                  onClick={
                    prepareCamera
                  }
                >
                  Enable camera
                </button>

              </div>
            )}

          </div>

          <div className="signal-note">

            <Camera size={15} />

            Video is being prepared for
            future confidence analysis.

          </div>

        </aside>

      </div>

      {/* -------------------------------------------- */}
      {/* START INTERVIEW OVERLAY                      */}
      {/* -------------------------------------------- */}

      {!started && (

        <div className="start-overlay">

          <div className="start-modal">

            <div className="eyebrow">
              INTERVIEW READY
            </div>

            <h2>
              Your interviewer is ready.
            </h2>

            <p>
              We’ll ask one question at a
              time. The AI will speak, you
              answer naturally, and the
              transcript is evaluated
              automatically.
            </p>

            <div className="permission-list">

              <span>
                <Mic />
                Microphone
              </span>

              <span>
                <Camera />
                Camera
              </span>

            </div>

            <button
              className="primary-btn large"
              onClick={begin}
            >

              <Check size={18} />

              Enter interview room

            </button>

          </div>

        </div>

      )}

    </main>
  );
}