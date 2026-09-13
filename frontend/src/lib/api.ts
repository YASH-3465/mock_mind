import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mockmind_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function signup(name: string, email: string, password: string) {
  return (await api.post("/auth/signup", { name, email, password })).data;
}

export async function login(email: string, password: string) {
  const data = (await api.post("/auth/login", { email, password })).data;
  localStorage.setItem("mockmind_token", data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem("mockmind_token");
  localStorage.removeItem("mockmind_session");
}

export async function uploadResume(file: File) {
  const form = new FormData();
  form.append("file", file);
  return (await api.post("/resume/upload", form)).data;
}

export async function analyzeResume(resumeId: number) {
  return (await api.post(`/analysis/${resumeId}`)).data;
}

export async function generateInterview(analysisId: number) {
  return (await api.post(`/interview/${analysisId}`)).data;
}

export async function saveAnswer(payload: {
  session_id: number;
  question_number: number;
  answer_text: string;
  answer_duration: number;
}) {
  return (await api.post("/answer/", payload)).data;
}

export async function evaluateAnswer(answerId: number) {
  return (await api.post(`/answer/${answerId}/evaluate`)).data;
}

export async function completeInterview(sessionId: number) {
  return (await api.post(`/interview/${sessionId}/complete`)).data;
}
