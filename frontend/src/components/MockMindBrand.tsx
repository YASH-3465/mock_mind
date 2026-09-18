import {
  FileText,
  History,
  LayoutDashboard,
  Menu,
  X,
  LogOut,
} from "lucide-react";

import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useState,
} from "react";

import {
  isLoggedIn,
  logout,
} from "../lib/api";

import mockmindLogo from "../assets/mockmind-logo.png";


export default function MockMindBrand() {

  const location = useLocation();
  const navigate = useNavigate();

  const loggedIn = isLoggedIn();

  const homePath = loggedIn
    ? "/dashboard"
    : "/";

  const [menuOpen, setMenuOpen] =
    useState(false);


  /* ========================================= */
  /* ACTIVE ROUTE                              */
  /* ========================================= */

  const isActive = (path: string) =>
    location.pathname === path;


  /* ========================================= */
  /* CLOSE MOBILE MENU ON PAGE CHANGE          */
  /* ========================================= */

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);


  /* ========================================= */
  /* LOGOUT                                    */
  /* ========================================= */

  function handleLogout() {

    logout();

    setMenuOpen(false);

    navigate("/");
  }


  function goToDashboard() {
  if (location.pathname === "/dashboard") {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } else {
    navigate("/dashboard");
  }
}

function goToHistory() {
  if (location.pathname === "/dashboard") {
    const historySection =
      document.getElementById("history");

    historySection?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  } else {
    navigate("/dashboard#history");
  }
}

  return (
    <nav className="mockmind-navbar">

      {/* ========================================= */}
      {/* BRAND                                     */}
      {/* ========================================= */}

      <Link
        to={homePath}
        className="mockmind-brand"
        aria-label="MockMind"
      >

        <img
          src={mockmindLogo}
          alt="MockMind"
          className="mockmind-brand-logo"
        />

        <span className="mockmind-wordmark">

          <span className="mock">
            MOCK
          </span>

          <span className="mind">
            MIND
          </span>

        </span>

      </Link>


      {/* ========================================= */}
      {/* DESKTOP NAVIGATION                        */}
      {/* ========================================= */}

      {loggedIn && (

        <div className="mockmind-nav-links">

          {/* DASHBOARD */}

          <button
  type="button"
  className={
    location.pathname === "/dashboard" &&
    !location.hash
      ? "active"
      : ""
  }
  onClick={goToDashboard}
>
  <LayoutDashboard size={16} />
  <span>Dashboard</span>
</button>


          {/* RESUME */}

          <Link
            to="/resume"
            className={
              isActive("/resume")
                ? "active"
                : ""
            }
          >

            <FileText size={16} />

            <span>
              Resume
            </span>

          </Link>


          {/* HISTORY */}

         <button
  type="button"
  className={
    location.pathname === "/dashboard" &&
    location.hash === "#history"
      ? "active"
      : ""
  }
  onClick={goToHistory}
>
  <History size={16} />
  <span>History</span>
</button>

        </div>

      )}


      {/* ========================================= */}
      {/* RIGHT SIDE                                */}
      {/* ========================================= */}

      <div className="mockmind-navbar-right">

        {/* ONLINE STATUS */}

        {loggedIn && (

          <span
            className="mockmind-online"
            title="Signed in"
          >

            <span />

            Online

          </span>

        )}


        {/* DESKTOP LOGOUT */}

        {loggedIn && (

          <button
            type="button"
            className="mockmind-logout"
            onClick={handleLogout}
          >

            <LogOut size={16} />

            <span>
              Log out
            </span>

          </button>

        )}


        {/* MOBILE MENU */}

        {loggedIn && (

          <button
            type="button"
            className="mockmind-menu-button"
            onClick={() =>
              setMenuOpen(!menuOpen)
            }
            aria-label={
              menuOpen
                ? "Close navigation"
                : "Open navigation"
            }
          >

            {menuOpen ? (
              <X size={19} />
            ) : (
              <Menu size={19} />
            )}

          </button>

        )}

      </div>


      {/* ========================================= */}
      {/* MOBILE MENU                               */}
      {/* ========================================= */}

      {loggedIn && menuOpen && (

        <div className="mockmind-mobile-menu">

          {/* DASHBOARD */}

          <Link
            to="/dashboard"
            className={
              isActive("/dashboard")
                ? "active"
                : ""
            }
          >

            <LayoutDashboard size={17} />

            Dashboard

          </Link>


          {/* RESUME */}

          <Link
            to="/resume"
            className={
              isActive("/resume")
                ? "active"
                : ""
            }
          >

            <FileText size={17} />

            Resume

          </Link>


          {/* HISTORY */}

         <Link
  to="/dashboard#history"
  className={
    location.pathname === "/dashboard" &&
    location.hash === "#history"
      ? "active"
      : ""
  }
>
  <History size={16} />
  <span>History</span>
</Link>

          {/* MOBILE LOGOUT */}

          <button
            type="button"
            className="mockmind-mobile-logout"
            onClick={handleLogout}
          >

            <LogOut size={17} />

            Log out

          </button>

        </div>

      )}

    </nav>
  );
}