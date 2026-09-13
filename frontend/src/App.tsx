import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/Landing/LandingPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ResumePage from "./pages/Resume/ResumePage";
import InterviewPage from "./pages/Interview/InterviewPage";
import ResultsPage from "./pages/Results/ResultsPage";

export default function App() {
  const protectedRoute = (element: React.ReactNode) =>
    localStorage.getItem("mockmind_token") ? element : <Navigate to="/login" replace />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={protectedRoute(<DashboardPage />)} />
        <Route path="/resume" element={protectedRoute(<ResumePage />)} />
        <Route path="/interview/:sessionId" element={protectedRoute(<InterviewPage />)} />
        <Route path="/results/:sessionId" element={protectedRoute(<ResultsPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
