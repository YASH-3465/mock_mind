import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect, useState } from "react";

import LandingPage from "./pages/Landing/LandingPage";
import LoginPage from "./pages/Auth/LoginPage";
import SignupPage from "./pages/Auth/SignupPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import ResumePage from "./pages/ResumePage";
import InterviewPage from "./pages/Interview/InterviewPage";
import ResultsPage from "./pages/ResultsPage";

import {
  getCurrentUser,
  isLoggedIn,
  clearAuth,
} from "./lib/api";

// --------------------------------------------------
// PROTECTED ROUTE
// --------------------------------------------------

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      // No token = definitely not authenticated
      if (!isLoggedIn()) {
        if (mounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
        }

        return;
      }

      try {
        // Ask backend to validate the JWT
        await getCurrentUser();

        if (mounted) {
          setAuthenticated(true);
        }
      } catch (error) {
        console.error(
          "Authentication check failed:",
          error
        );

        // Token is invalid/expired
        clearAuth();

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // ----------------------------------------------
  // AUTH CHECK IN PROGRESS
  // ----------------------------------------------

  if (checkingAuth) {
    return (
      <main className="loading-screen">
        <div className="loading-content">
          <span className="brand-mark">M</span>

          <p>
            Verifying your session…
          </p>
        </div>
      </main>
    );
  }

  // ----------------------------------------------
  // NOT AUTHENTICATED
  // ----------------------------------------------

  if (!authenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  // ----------------------------------------------
  // AUTHENTICATED
  // ----------------------------------------------

  return <>{children}</>;
}

// --------------------------------------------------
// PUBLIC ROUTE THAT REDIRECTS LOGGED-IN USERS
// --------------------------------------------------

function PublicOnlyRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  const [authenticated, setAuthenticated] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuthentication() {
      if (!isLoggedIn()) {
        if (mounted) {
          setAuthenticated(false);
          setCheckingAuth(false);
        }

        return;
      }

      try {
        await getCurrentUser();

        if (mounted) {
          setAuthenticated(true);
        }
      } catch {
        clearAuth();

        if (mounted) {
          setAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setCheckingAuth(false);
        }
      }
    }

    checkAuthentication();

    return () => {
      mounted = false;
    };
  }, []);

  // ----------------------------------------------
  // AUTH CHECK IN PROGRESS
  // ----------------------------------------------

  if (checkingAuth) {
    return (
      <main className="loading-screen">
        <div className="loading-content">
          <span className="brand-mark">M</span>

          <p>
            Verifying your session…
          </p>
        </div>
      </main>
    );
  }

  // ----------------------------------------------
  // ALREADY LOGGED IN
  // ----------------------------------------------

  if (authenticated) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <>{children}</>;
}

// --------------------------------------------------
// APP
// --------------------------------------------------

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ---------------------------------------- */}
        {/* PUBLIC                                   */}
        {/* ---------------------------------------- */}

        <Route
          path="/"
          element={<LandingPage />}
        />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/signup"
          element={
            <PublicOnlyRoute>
              <SignupPage />
            </PublicOnlyRoute>
          }
        />

        {/* ---------------------------------------- */}
        {/* PROTECTED                                */}
        {/* ---------------------------------------- */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/resume"
          element={
            <ProtectedRoute>
              <ResumePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/interview/:sessionId"
          element={
            <ProtectedRoute>
              <InterviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/results/:sessionId"
          element={
            <ProtectedRoute>
              <ResultsPage />
            </ProtectedRoute>
          }
        />

        {/* ---------------------------------------- */}
        {/* FALLBACK                                 */}
        {/* ---------------------------------------- */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}