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
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import {
  completeInterview,
  saveAnswer,
  cancelInterview,
  getCurrentUser,
} from "../../lib/api";

import type {
  InterviewData,
  Question,
} from "../../lib/types";

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

  // --------------------------------------------------
  // INTERVIEW DATA
  // --------------------------------------------------

  const [questions, setQuestions] = useState<Question[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");

  // --------------------------------------------------
  // INTERVIEW STATE
  // --------------------------------------------------

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [saving, setSaving] = useState(false);

  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [showEndModal, setShowEndModal] = useState(false);
const [endingInterview, setEndingInterview] = useState(false);

  // --------------------------------------------------
  // PERMISSION / INTRO STATE
  // --------------------------------------------------

  const [candidateName, setCandidateName] = useState("there");

  const [permissionStage, setPermissionStage] = useState<
    "intro" | "requesting" | "ready" | "error" | "question"
  >("intro");

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

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
   * Keeps the latest interview state available
   * inside asynchronous callbacks.
   *
   * This avoids stale React state inside
   * speechSynthesis callbacks.
   */
  const startedRef = useRef(false);
  const savingRef = useRef(false);

  /*
   * Stores final speech transcripts.
   */
  const finalTranscriptRef = useRef("");

  /*
   * Prevents welcome sequence from running
   * more than once.
   */
  const introStartedRef = useRef(false);

  /*
   * Prevents multiple recognition instances
   * from being created simultaneously.
   */
  const recognitionStartingRef = useRef(false);

  const question = questions[index];

  // --------------------------------------------------
  // KEEP LIVE REFS SYNCHRONIZED
  // --------------------------------------------------

  useEffect(() => {
    startedRef.current = started;
  }, [started]);

  useEffect(() => {
    savingRef.current = saving;
  }, [saving]);

  // --------------------------------------------------
  // LOAD CURRENT USER
  // --------------------------------------------------

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const user = await getCurrentUser();

        if (user?.full_name) {
          setCandidateName(user.full_name);
        }
      } catch (error) {
        console.error(
          "Could not load current user:",
          error
        );
      }
    }

    loadCurrentUser();
  }, []);

  // --------------------------------------------------
  // LOAD QUESTIONS
  // --------------------------------------------------

  useEffect(() => {
    if (!sessionId) return;

    const raw = localStorage.getItem(
      "mockmind_questions"
    );

    if (!raw) return;

    try {
      const data =
        JSON.parse(raw) as InterviewData;

      if (
        String(data.session_id) ===
        sessionId
      ) {
        setQuestions(data.questions);
      }
    } catch (error) {
      console.error(
        "Could not load interview questions:",
        error
      );
    }
  }, [sessionId]);

  // --------------------------------------------------
  // INTERVIEW TIMER
  // --------------------------------------------------

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(
        Math.floor(
          (Date.now() -
            startedAt.current) /
            1000
        )
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

      streamRef.current
        ?.getTracks()
        .forEach((track) => {
          track.stop();
        });

      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }

      recognitionRef.current = null;

      speechSynthesis.cancel();
    };
  }, []);

  // --------------------------------------------------
  // FIND A NATURAL-SOUNDING VOICE
  // --------------------------------------------------

  function getPreferredVoice() {
    const voices =
      speechSynthesis.getVoices();

    if (!voices.length) {
      return null;
    }

    const preferredNames = [
      "Google US English",
      "Google UK English Female",
      "Microsoft Jenny",
      "Microsoft Aria",
      "Microsoft Ava",
      "Samantha",
      "Karen",
      "Daniel",
    ];

    for (const preferred of preferredNames) {
      const match = voices.find(
        (voice) =>
          voice.name
            .toLowerCase()
            .includes(
              preferred.toLowerCase()
            )
      );

      if (match) {
        return match;
      }
    }

    return (
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith("en-us")
      ) ??
      voices.find(
        (voice) =>
          voice.lang
            .toLowerCase()
            .startsWith("en")
      ) ??
      voices[0]
    );
  }

  // --------------------------------------------------
  // TEXT TO SPEECH
  // --------------------------------------------------

  function speak(
    text: string,
    onEnd?: () => void,
    autoListen = false
  ) {
    setSpeaking(true);

    /*
     * Stop previous speech.
     */
    speechSynthesis.cancel();

    /*
     * AI must not listen to itself.
     */
    shouldListenRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore recognition stop errors
      }

      recognitionRef.current = null;
    }

    setListening(false);

    const utterance =
      new SpeechSynthesisUtterance(text);

    /*
     * Use the preferred browser voice when available.
     */
    const preferredVoice =
      getPreferredVoice();

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.96;
    utterance.pitch = 1;

    const finishSpeech = () => {
      setSpeaking(false);

      /*
       * Run the supplied callback first.
       */
      if (onEnd) {
        onEnd();
      }

      /*
       * IMPORTANT:
       *
       * Use refs instead of React state here.
       *
       * React state can be stale inside asynchronous
       * speech callbacks.
       */
      if (
        autoListen &&
        startedRef.current &&
        !savingRef.current
      ) {
        setTimeout(() => {
          if (
            startedRef.current &&
            !savingRef.current
          ) {
            startListening();
          }
        }, 500);
      }
    };

    utterance.onend = finishSpeech;

    utterance.onerror = () => {
      setSpeaking(false);

      if (onEnd) {
        onEnd();
      }

      /*
       * Even if TTS fails, continue automatically.
       */
      if (
        autoListen &&
        startedRef.current &&
        !savingRef.current
      ) {
        setTimeout(() => {
          if (
            startedRef.current &&
            !savingRef.current
          ) {
            startListening();
          }
        }, 500);
      }
    };

    speechSynthesis.speak(utterance);
  }

  // --------------------------------------------------
  // CAMERA + MICROPHONE PERMISSION
  // --------------------------------------------------

  async function prepareCamera(): Promise<boolean> {
    try {
      setCameraError("");
      setPermissionStage("requesting");

      /*
       * Request BOTH camera and microphone together.
       */
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            video: true,
            audio: true,
          }
        );

      /*
       * Stop any previous stream first.
       */
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop();
          });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject =
          stream;

        try {
          await videoRef.current.play();
        } catch (error) {
          console.log(
            "Video playback note:",
            error
          );
        }
      }

      setCameraOn(true);
      setPermissionStage("ready");

      return true;
    } catch (error) {
      console.error(
        "Camera/microphone permission error:",
        error
      );

      setCameraOn(false);
      setPermissionStage("error");

      setCameraError(
        "Camera or microphone permission was not granted. Please allow both permissions and try again."
      );

      return false;
    }
  }

  // --------------------------------------------------
  // CONNECT CAMERA STREAM TO VIDEO
  // --------------------------------------------------

  useEffect(() => {
    if (
      cameraOn &&
      videoRef.current &&
      streamRef.current
    ) {
      videoRef.current.srcObject =
        streamRef.current;

      videoRef.current
        .play()
        .catch((error) => {
          console.log(
            "Video autoplay error:",
            error
          );
        });
    }
  }, [cameraOn]);

  // --------------------------------------------------
  // BEGIN INTERVIEW
  // --------------------------------------------------

  function begin() {
    if (introStartedRef.current) {
      return;
    }

    introStartedRef.current = true;

    /*
     * Update both state AND ref immediately.
     */
    startedRef.current = true;
    setStarted(true);

    startedAt.current =
      Date.now();

    setPermissionStage("intro");

    const welcomeMessage =
      `Hi ${candidateName}, welcome to Mock Mind. ` +
      `I'll be your interviewer today. ` +
      `Before we begin, I'll need access to your camera and microphone. ` +
      `Please allow both permissions when your browser asks. ` +
      `Your camera helps us capture your interview presence, and your microphone lets me hear your answers. ` +
      `Once you've allowed them, we'll get started.`;

    /*
     * Do NOT listen during permission explanation.
     */
    speak(
      welcomeMessage,
      async () => {
        /*
         * Request permissions only AFTER
         * the candidate has heard the explanation.
         */
        const permissionGranted =
          await prepareCamera();

        if (!permissionGranted) {
          return;
        }

        /*
         * Allow camera preview to render.
         */
        setTimeout(() => {
          setPermissionStage(
            "question"
          );

          speakFirstQuestion();
        }, 700);
      },
      false
    );
  }

  // --------------------------------------------------
  // SPEAK FIRST QUESTION
  // --------------------------------------------------

  function speakFirstQuestion() {
    if (!question) {
      return;
    }

    speak(
      `Alright ${candidateName}, let's get started. ${question.question}`,
      undefined,
      true
    );
  }

  // --------------------------------------------------
  // SPEECH RECOGNITION
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
     * Do not start while AI is speaking.
     */
    if (speaking) {
      return;
    }

    /*
     * Already listening.
     */
    if (shouldListenRef.current) {
      return;
    }

    /*
     * Prevent duplicate start attempts.
     */
    if (recognitionStartingRef.current) {
      return;
    }

    shouldListenRef.current = true;
    recognitionStartingRef.current = true;

    const startRecognition = () => {
      if (
        !shouldListenRef.current ||
        !startedRef.current ||
        savingRef.current
      ) {
        recognitionStartingRef.current = false;
        return;
      }

      /*
       * Make sure an old recognition instance
       * isn't still alive.
       */
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }

        recognitionRef.current = null;
      }

      const recognition = new C();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        recognitionStartingRef.current = false;
        setListening(true);

        console.log(
          "MockMind speech recognition started."
        );
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = "";

        for (
          let i = event.resultIndex;
          i < event.results.length;
          i++
        ) {
          const transcript =
            event.results[i][0]
              .transcript;

          if (
            event.results[i].isFinal
          ) {
            finalTranscriptRef.current +=
              transcript + " ";
          } else {
            interimTranscript +=
              transcript;
          }
        }

        setAnswer(
          finalTranscriptRef.current +
            interimTranscript
        );
      };

      recognition.onerror = (
        event: any
      ) => {
        console.log(
          "Speech recognition error:",
          event.error
        );

        recognitionStartingRef.current =
          false;

        /*
         * These are recoverable browser events.
         */
        if (
          event.error ===
            "no-speech" ||
          event.error ===
            "aborted"
        ) {
          return;
        }

        /*
         * Browser denied speech recognition.
         */
        if (
          event.error ===
          "not-allowed"
        ) {
          shouldListenRef.current =
            false;

          setListening(false);

          toast.error(
            "Microphone/speech recognition permission was denied. Please allow microphone access in your browser."
          );

          return;
        }

        /*
         * For other temporary errors,
         * keep the listening lifecycle alive.
         */
        if (
          shouldListenRef.current &&
          startedRef.current &&
          !savingRef.current
        ) {
          setTimeout(() => {
            if (
              shouldListenRef.current &&
              startedRef.current &&
              !savingRef.current
            ) {
              startRecognition();
            }
          }, 700);
        }
      };

      recognition.onend = () => {
        recognitionStartingRef.current =
          false;

        setListening(false);

        recognitionRef.current =
          null;

        /*
         * Chrome sometimes ends continuous recognition
         * automatically.
         *
         * Restart automatically while the candidate
         * is still answering.
         */
        if (
          shouldListenRef.current &&
          startedRef.current &&
          !savingRef.current
        ) {
          setTimeout(() => {
            if (
              shouldListenRef.current &&
              startedRef.current &&
              !savingRef.current
            ) {
              startListening();
            }
          }, 350);
        }
      };

      recognitionRef.current =
        recognition;

      try {
        recognition.start();
      } catch (error) {
        recognitionStartingRef.current =
          false;

        console.log(
          "Recognition start error:",
          error
        );

        /*
         * If browser says recognition is already
         * starting, let the current lifecycle settle.
         */
      }
    };

    startRecognition();
  }

  // --------------------------------------------------
  // STOP SPEECH RECOGNITION
  // --------------------------------------------------

  function stopListening() {
    shouldListenRef.current =
      false;

    recognitionStartingRef.current =
      false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }

      recognitionRef.current =
        null;
    }

    setListening(false);
  }

  // --------------------------------------------------
  // NATURAL ACKNOWLEDGEMENT
  // --------------------------------------------------

  function getAcknowledgement(
    currentQuestion: Question,
    currentAnswer: string
  ) {
    const category =
      currentQuestion.category
        ?.toLowerCase() ?? "";

    const answerLength =
      currentAnswer.trim().length;

    /*
     * Local logic only.
     *
     * NO Gemini/API request.
     */
    if (
      category.includes("behavior") ||
      category.includes("leadership") ||
      category.includes("experience")
    ) {
      if (answerLength > 350) {
        return "Thank you. That's a really useful example, and I appreciate the detail.";
      }

      return "Hmm, got it. That's helpful context.";
    }

    if (
      category.includes("technical") ||
      category.includes("computer") ||
      category.includes("programming")
    ) {
      if (answerLength > 350) {
        return "Got it. Thank you for walking me through that.";
      }

      return "Okay, I understand. Thank you.";
    }

    if (
      category.includes("project")
    ) {
      return "Interesting. Thanks for explaining how you approached it.";
    }

    if (
      category.includes("database") ||
      category.includes("network")
    ) {
      return "Got it. That's a good explanation.";
    }

    if (answerLength > 450) {
      return "Thank you. That gives me a good picture of your thinking.";
    }

    return "Hmm, got it. Thank you for your answer.";
  }



  // --------------------------------------------------
// END / CANCEL INTERVIEW
// --------------------------------------------------

function openEndInterviewModal() {
  if (saving || endingInterview) return;

  setShowEndModal(true);
}

function closeEndInterviewModal() {
  if (endingInterview) return;

  setShowEndModal(false);
}

async function endInterview() {
  if (endingInterview || !sessionId) return;

  setEndingInterview(true);

  shouldListenRef.current = false;

  // Stop speech recognition
  if (recognitionRef.current) {
    try {
      recognitionRef.current.stop();
    } catch {
      // Ignore cleanup errors
    }

    recognitionRef.current = null;
  }

  setListening(false);

  // Stop AI speech
  try {
    speechSynthesis.cancel();
  } catch {
    // Ignore cleanup errors
  }

  setSpeaking(false);

  // Stop camera + microphone
  if (streamRef.current) {
    streamRef.current
      .getTracks()
      .forEach((track) => {
        try {
          track.stop();
        } catch {
          // Ignore cleanup errors
        }
      });

    streamRef.current = null;
  }

  setCameraOn(false);

  try {
    // Delete incomplete interview from backend
    await cancelInterview(Number(sessionId));

    // Clear local interview state
    localStorage.removeItem("mockmind_session");
    localStorage.removeItem("mockmind_questions");

    setShowEndModal(false);

    navigate("/dashboard", {
      replace: true,
    });
  } catch (error: any) {
    console.error(
      "Could not cancel interview:",
      error
    );

    toast.error(
      error?.response?.data?.detail ??
      "Could not cancel the interview. Please try again."
    );

    setEndingInterview(false);
  }
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

    /*
     * Update both state and ref immediately.
     */
    savingRef.current = true;
    setSaving(true);

    stopListening();

    speechSynthesis.cancel();

    try {
      // --------------------------------------------
      // SAVE ANSWER
      // --------------------------------------------

      await saveAnswer({
        session_id:
          Number(sessionId),

        question_number:
          question.question_number,

        answer_text:
          answer.trim(),

        answer_duration:
          Math.max(
            1,
            elapsed
          ),
      });

      // --------------------------------------------
      // FINAL QUESTION
      // --------------------------------------------

      if (
        index ===
        questions.length - 1
      ) {
        const result =
          await completeInterview(
            Number(sessionId)
          );

        if (result?.error) {
          toast.error(
            result.reason ??
              result.error ??
              "Interview could not be completed."
          );

          savingRef.current = false;
          setSaving(false);

          return;
        }

        /*
         * Interview is over.
         */
        startedRef.current = false;
        setStarted(false);

        navigate(
          `/results/${sessionId}`,
          {
            state: result,
          }
        );

        return;
      }

      // --------------------------------------------
      // ACKNOWLEDGEMENT
      // --------------------------------------------

      const acknowledgement =
        getAcknowledgement(
          question,
          answer
        );

      finalTranscriptRef.current =
        "";

      setAnswer("");

      /*
       * Move to next question.
       */
      const nextIndex =
        index + 1;

      setIndex(nextIndex);

      /*
       * IMPORTANT:
       *
       * We need saving=false BEFORE the next
       * question eventually attempts automatic
       * listening.
       *
       * Update ref immediately.
       */
      savingRef.current = false;
      setSaving(false);

      /*
       * Speak acknowledgement first.
       */
      speak(
        acknowledgement,
        () => {
          setTimeout(() => {
            const nextQuestion =
              questions[nextIndex];

            if (!nextQuestion) {
              return;
            }

            /*
             * AI asks the next question.
             *
             * When speech ends, speak() automatically
             * starts speech recognition.
             */
            speak(
              nextQuestion.question,
              undefined,
              true
            );
          }, 250);
        },
        false
      );
    } catch (err: any) {
      console.error(
        "Interview answer submission error:",
        err
      );

      toast.error(
        err?.response?.data
          ?.detail ??
          err?.response?.data
            ?.reason ??
          "Could not save this answer."
      );

      savingRef.current = false;
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
    QUESTION{" "}
    {index + 1} /{" "}
    {questions.length}
  </div>

  <div className="interview-header-actions">

    <div className="timer">
      {String(
        Math.floor(elapsed / 60)
      ).padStart(2, "0")}
      :
      {String(
        elapsed % 60
      ).padStart(2, "0")}
    </div>

    <button
      className="end-interview-btn"
      onClick={openEndInterviewModal}
      disabled={
        saving ||
        endingInterview
      }
      type="button"
    >
      <X size={16} />
      <span>End interview</span>
    </button>

  </div>

</header>
      {/* -------------------------------------------- */}
      {/* MAIN INTERVIEW GRID                          */}
      {/* -------------------------------------------- */}

      <div className="interview-grid">

        {/* ------------------------------------------ */}
        {/* AI INTERVIEWER                             */}
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
              ? "Speaking…"
              : listening
              ? "Listening to you…"
              : permissionStage ===
                "requesting"
              ? "Waiting for permissions…"
              : permissionStage ===
                "ready"
              ? "You're all set."
              : "Take your time."}
          </p>

          <div className="voice-bars">
            {[
              1,
              2,
              3,
              4,
              5,
              6,
              7,
            ].map((n) => (
              <i
                className={
                  speaking ||
                  listening
                    ? "active"
                    : ""
                }
                key={n}
              />
            ))}
          </div>

        </aside>

        {/* ------------------------------------------ */}
        {/* CONVERSATION                               */}
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

            {/* TEXTAREA */}

            <textarea
              value={answer}
              onChange={(e) =>
                setAnswer(
                  e.target.value
                )
              }
              placeholder="Speak naturally. Your transcript will appear here…"
            />

            {/* ANSWER CONTROLS */}

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
                  <MicOff
                    size={17}
                  />
                ) : (
                  <Mic
                    size={17}
                  />
                )}

                {listening
                  ? "Stop listening"
                  : "Use microphone"}

              </button>

              <button
                className="tool-btn"
                onClick={() =>
                  speak(
                    question.question
                  )
                }
                disabled={
                  speaking ||
                  saving
                }
              >

                <Volume2
                  size={17}
                />

                Repeat

              </button>

              <button
                className="send-btn"
                onClick={
                  submit
                }
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
                  <Send
                    size={17}
                  />
                )}

                {index ===
                questions.length -
                  1
                  ? "Finish interview"
                  : "Submit answer"}

              </button>

            </div>

            {/* HELP TEXT */}

            <p className="skip-note">
              If you genuinely
              don’t know, say
              “Sorry, I don’t
              know the answer.”
              It will be recorded
              and evaluated as
              part of the
              interview.
            </p>

          </div>

        </section>

        {/* ------------------------------------------ */}
        {/* CAMERA                                     */}
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

                <CameraOff
                  size={28}
                />

                <span>
                  {cameraError ||
                    "Camera is off"}
                </span>

                {started &&
                  permissionStage !==
                    "intro" && (
                    <button
                      className="ghost-btn"
                      onClick={
                        prepareCamera
                      }
                    >
                      Enable camera
                    </button>
                  )}

              </div>
            )}

          </div>

          <div className="signal-note">

            <Camera
              size={15}
            />

            Video is being
            prepared for future
            confidence analysis.

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
              We’ll ask one
              question at a time.
              The AI will speak,
              you answer naturally,
              and your responses
              will be evaluated
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
              onClick={
                begin
              }
            >

              <Check
                size={18}
              />

              Enter interview room

            </button>

          </div>

        </div>

      )}

      {/* -------------------------------------------- */}
      {/* PERMISSION ERROR OVERLAY                     */}
      {/* -------------------------------------------- */}

      {started &&
        permissionStage ===
          "error" && (

        <div className="start-overlay">

          <div className="start-modal">

            <div className="eyebrow">
              PERMISSION NEEDED
            </div>

            <h2>
              Almost there,{" "}
              {candidateName}.
            </h2>

            <p>
              I couldn't access your
              camera or microphone.
              Please check your
              browser permissions
              and allow access so
              Mock Mind can continue
              with the interview.
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
              onClick={
                async () => {
                  const granted =
                    await prepareCamera();

                  if (granted) {
                    setTimeout(() => {
                      setPermissionStage(
                        "question"
                      );

                      speakFirstQuestion();
                    }, 500);
                  }
                }
              }
            >

              <Check
                size={18}
              />

              Try permissions again

            </button>

          </div>

        </div>

      )}

      {/* -------------------------------------------- */}
{/* END INTERVIEW CONFIRMATION                  */}
{/* -------------------------------------------- */}

{showEndModal && (

  <div
    className="end-interview-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="end-interview-title"
  >

    <div className="end-interview-modal">

  <button
    className="end-interview-icon"
    type="button"
    onClick={closeEndInterviewModal}
    disabled={endingInterview}
    aria-label="Continue interview"
  >
    <X size={22} />
  </button>

  <div className="eyebrow">
    END INTERVIEW
  </div>

  <h2 id="end-interview-title">
    Are you sure you want to leave?
  </h2>

  <p>
    If you end this interview now, your current
    interview session will not be saved or evaluated.
    Any answers already submitted will not be included
    in the final interview result.
  </p>

  <div className="end-interview-actions">

    <button
      className="ghost-btn"
      type="button"
      onClick={closeEndInterviewModal}
      disabled={endingInterview}
    >
      Continue interview
    </button>

    <button
      className="danger-btn"
      type="button"
      onClick={endInterview}
      disabled={endingInterview}
    >
      {endingInterview ? (
        <>
          <LoaderCircle
            className="spin"
            size={16}
          />
          Ending…
        </>
      ) : (
        <>
          <X size={16} />
          End interview
        </>
      )}
    </button>

  </div>

</div>

  </div>

)}

    </main>
  );
}