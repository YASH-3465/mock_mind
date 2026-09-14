import axios from "axios";

export const API_BASE =
  import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

// --------------------------------------------------
// AUTH TOKEN INTERCEPTOR
// --------------------------------------------------

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

// --------------------------------------------------
// CURRENT USER
// --------------------------------------------------

export type CurrentUser = {
  id: number;
  full_name: string;
  email: string;
  created_at: string;
};

export async function getCurrentUser(): Promise<CurrentUser> {
  return (
    await api.get("/auth/me")
  ).data;
}

// --------------------------------------------------
// AUTH STATE HELPERS
// --------------------------------------------------

export function isLoggedIn(): boolean {
  return Boolean(
    localStorage.getItem("mockmind_token")
  );
}

export function clearAuth() {
  localStorage.removeItem("mockmind_token");
  localStorage.removeItem("mockmind_session");
  localStorage.removeItem("mockmind_questions");
}

export function logout() {
  clearAuth();
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
  return (
    await api.get("/resume/history")
  ).data;
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
  return (
    await api.get("/resume/")
  ).data;
}

export async function analyzeResume(
  resumeId: number
): Promise<ResumeAnalysis> {
  return (
    await api.post(
      `/analysis/${resumeId}`
    )
  ).data;
}

// --------------------------------------------------
// INTERVIEW
// --------------------------------------------------

export async function generateInterview(
  analysisId: number
) {
  return (
    await api.post(
      `/interview/${analysisId}`
    )
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


export async function cancelInterview(
  sessionId: number
) {
  const response = await api.delete(
    `/interview/${sessionId}/cancel`
  );

  return response.data;
}
// --------------------------------------------------
// INTERVIEW HISTORY
// --------------------------------------------------

export async function getInterviewHistory() {
  return (
    await api.get(
      "/interview/history"
    )
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
    await api.post(
      "/answer/",
      payload
    )
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