import { useEffect, useState } from "react";
import {
  FileText,
  LoaderCircle,
  UploadCloud,
  ArrowRight,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import {
  analyzeResume,
  generateInterview,
  uploadResume,
  getMyResumes,
} from "../lib/api";

import type { Resume } from "../lib/types";

import MockMindBrand from "../components/MockMindBrand";

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);

  const [resumes, setResumes] = useState<Resume[]>([]);
  const [selectedResumeId, setSelectedResumeId] =
    useState<number | null>(null);

  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("");

  const navigate = useNavigate();

  // --------------------------------------------------
  // LOAD PREVIOUS RESUMES
  // --------------------------------------------------

  useEffect(() => {
    async function loadResumes() {
      try {
        const data = await getMyResumes();

        // Remove duplicate resume entries by file name
        const uniqueResumes = data.filter(
          (resume: Resume, index: number, self: Resume[]) =>
            index ===
            self.findIndex(
              (item) =>
                item.file_name.toLowerCase() ===
                resume.file_name.toLowerCase()
            )
        );

        setResumes(uniqueResumes);
      } catch (err) {
        console.error(
          "Could not load previous resumes:",
          err
        );
      }
    }

    loadResumes();
  }, []);

  // --------------------------------------------------
  // SELECT PREVIOUS RESUME
  // --------------------------------------------------

  function selectPreviousResume(resume: Resume) {
    setSelectedResumeId(resume.id);
    setFile(null);
  }

  // --------------------------------------------------
  // SELECT NEW FILE
  // --------------------------------------------------

  function selectNewFile(selectedFile: File | null) {
    if (!selectedFile) return;

    setFile(selectedFile);
    setSelectedResumeId(null);
  }

  // --------------------------------------------------
  // START INTERVIEW
  // --------------------------------------------------

  async function start() {
    if (!file && !selectedResumeId) return;

    setBusy(true);

    try {
      let resumeId: number;

      // ----------------------------------------------
      // NEW RESUME
      // ----------------------------------------------

      if (file) {
        setStage("Uploading resume…");

        const resume = await uploadResume(file);

        resumeId = resume.id;
      }

      // ----------------------------------------------
      // PREVIOUS RESUME
      // ----------------------------------------------

      else {
        resumeId = selectedResumeId!;
      }

      // ----------------------------------------------
      // ANALYSIS
      // ----------------------------------------------

      setStage("Analyzing your profile…");

      const analysis = await analyzeResume(resumeId);

      // ----------------------------------------------
      // GENERATE INTERVIEW
      // ----------------------------------------------

      setStage("Building your interview…");

      const interview = await generateInterview(
        analysis.id
      );

      localStorage.setItem(
        "mockmind_session",
        String(interview.session_id)
      );

      localStorage.setItem(
        "mockmind_questions",
        JSON.stringify(interview)
      );

      navigate(
        `/interview/${interview.session_id}`
      );
    } catch (err: any) {
      console.error(err);

      toast.error(
        err?.response?.data?.detail ??
          "Could not prepare the interview."
      );
    } finally {
      setBusy(false);
      setStage("");
    }
  }

  const ready =
    file !== null || selectedResumeId !== null;

  return (
    <main className="app-shell">

      {/* -------------------------------------------- */}
      {/* NAV */}
      {/* -------------------------------------------- */}

      <nav className="nav">

       <MockMindBrand />

        <span className="step-label">
          SETUP / 01
        </span>

      </nav>

      {/* -------------------------------------------- */}
      {/* PAGE */}
      {/* -------------------------------------------- */}

      <section className="resume-page">

        <div className="resume-copy">

          <div className="eyebrow">
            STEP 01 / YOUR RESUME
          </div>

          <h1>
            Give the interviewer something real
            to work with.
          </h1>

          <p>
            Choose a previously uploaded resume
            or upload a new one. Your existing
            analysis will be reused whenever
            possible.
          </p>

          <div className="resume-points">

            <span>
              <CheckCircle2 />
              Questions reference your profile
            </span>

            <span>
              <CheckCircle2 />
              No unnecessary Gemini analysis
            </span>

            <span>
              <CheckCircle2 />
              One continuous interview session
            </span>

          </div>

        </div>

        <div className="upload-card">

          {/* ---------------------------------------- */}
          {/* PREVIOUS RESUMES                         */}
          {/* ---------------------------------------- */}

          {resumes.length > 0 && (

            <div className="previous-resumes">

              <div className="previous-title">
                <span>
                  <Clock3 size={16} />
                  Previous resumes
                </span>

                <small>
                  {resumes.length} available
                </small>
              </div>

              <div className="resume-list">

                {resumes.map((resume) => (

                  <button
                    key={resume.id}
                    type="button"
                    className={
                      selectedResumeId === resume.id
                        ? "previous-resume selected"
                        : "previous-resume"
                    }
                    onClick={() =>
                      selectPreviousResume(
                        resume
                      )
                    }
                  >

                    <div className="previous-icon">
                      <FileText size={19} />
                    </div>

                    <div className="previous-info">

                      <strong>
                        {resume.file_name}
                      </strong>

                      <small>
                        Uploaded{" "}
                        {new Date(
                          resume.uploaded_at
                        ).toLocaleDateString()}
                      </small>

                    </div>

                    {selectedResumeId ===
                      resume.id && (
                      <CheckCircle2
                        size={19}
                      />
                    )}

                  </button>

                ))}

              </div>

              <div className="or-divider">
                <span>OR</span>
              </div>

            </div>

          )}

          {/* ---------------------------------------- */}
          {/* NEW RESUME                               */}
          {/* ---------------------------------------- */}

          <input
            id="resume"
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) =>
              selectNewFile(
                e.target.files?.[0] ?? null
              )
            }
          />

          <label
            htmlFor="resume"
            className="dropzone"
          >

            <div className="upload-icon">
              <UploadCloud size={29} />
            </div>

            <h3>
              {file
                ? file.name
                : "Upload a new resume"}
            </h3>

            <p>
              {file
                ? "PDF selected"
                : "or click to browse • PDF only"}
            </p>

          </label>

          {/* ---------------------------------------- */}
          {/* SELECTED NEW FILE                        */}
          {/* ---------------------------------------- */}

          {file && (

            <div className="file-row">

              <FileText size={18} />

              <span>
                {file.name}
              </span>

              <b>
                Ready
              </b>

            </div>

          )}

          {/* ---------------------------------------- */}
          {/* START                                    */}
          {/* ---------------------------------------- */}

          <button
            className="primary-btn full"
            disabled={!ready || busy}
            onClick={start}
          >

            {busy ? (
              <>
                <LoaderCircle
                  className="spin"
                  size={17}
                />

                {stage}
              </>
            ) : (
              <>
                {selectedResumeId
                  ? "Use this resume"
                  : "Build my interview"}

                <ArrowRight size={17} />
              </>
            )}

          </button>

          <small>
            Your camera and microphone are requested
            only when the interview begins.
          </small>

        </div>

      </section>

    </main>
  );
}