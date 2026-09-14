import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mockmind_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// --------------------------------------------------
// AUTH
// --------------------------------------------------

export async function signup(
  full_name: string,
  email: string,
  password: string
) {
  return (
    await api.post("/auth/signup", {
      full_name,
      email,
      password,
    })
  ).data;
}

export async function login(
  email: string,
  password: string
) {
  const data = (
    await api.post("/auth/login", {
      email,
      password,
    })
  ).data;

  localStorage.setItem(
    "mockmind_token",
    data.access_token
  );

  return data;
}

export function logout() {
  localStorage.removeItem("mockmind_token");
  localStorage.removeItem("mockmind_session");
  localStorage.removeItem("mockmind_questions");
}

// --------------------------------------------------
// RESUME
// --------------------------------------------------

export async function uploadResume(file: File) {
  const form = new FormData();

  form.append("file", file);

  return (
    await api.post("/resume/upload", form)
  ).data;
}

export async function getResumeHistory() {
  return (await api.get("/resume/history")).data;
}
// --------------------------------------------------
// RESUME ANALYSIS
// --------------------------------------------------

export type ResumeAnalysis = {
  id: number;
  resume_id: number;
  summary: string | null;
  skills: string | null;
  projects: string | null;
  experience: string | null;
  education: string | null;
  certifications: string | null;
  strengths: string | null;
  weaknesses: string | null;
  created_at: string;
};

export async function getMyResumes() {
  return (await api.get("/resume/")).data;
}

export async function analyzeResume(
  resumeId: number
): Promise<ResumeAnalysis> {
  return (await api.post(`/analysis/${resumeId}`)).data;
}

// --------------------------------------------------
// INTERVIEW
// --------------------------------------------------

export async function generateInterview(
  analysisId: number
) {
  return (
    await api.post(`/interview/${analysisId}`)
  ).data;
}

export async function completeInterview(
  sessionId: number
) {
  return (
    await api.post(
      `/interview/${sessionId}/complete`
    )
  ).data;
}

// --------------------------------------------------
// INTERVIEW HISTORY
// --------------------------------------------------

export async function getInterviewHistory() {
  return (
    await api.get("/interview/history")
  ).data;
}

// --------------------------------------------------
// ANSWERS
// --------------------------------------------------

export async function saveAnswer(payload: {
  session_id: number;
  question_number: number;
  answer_text: string;
  answer_duration: number;
}) {
  return (
    await api.post("/answer/", payload)
  ).data;
}

export async function evaluateAnswer(
  answerId: number
) {
  return (
    await api.post(
      `/answer/${answerId}/evaluate`
    )
  ).data;
}



