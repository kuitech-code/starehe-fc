import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import {
  checkAdminSession,
  installAdminFetchAuth,
  signInAdmin,
  signOutAdmin,
} from "./adminAuth";

installAdminFetchAuth();

function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  const [adminProfile, setAdminProfile] = useState({
    display_name: "Administrator",
    role: "Club Admin",
  });

  useEffect(() => {
  if (!authenticated) return;

  let cancelled = false;

  const updateProfile = (event) => {
    setAdminProfile(event.detail);
  };

  window.addEventListener("starehe-admin-profile-updated", updateProfile);

  fetch(
    `${(import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "")}/api/admin/profile`
  )
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      if (!cancelled && data) setAdminProfile(data);
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    window.removeEventListener(
      "starehe-admin-profile-updated",
      updateProfile
    );
  };
}, [authenticated]);

  useEffect(() => {
    let cancelled = false;

    const handleExpiredSession = () => {
      setAuthenticated(false);
      setError("Your sign-in expired. Please sign in again.");
    };

    window.addEventListener(
      "starehe-admin-session-expired",
      handleExpiredSession
    );

    checkAdminSession().then((isAuthenticated) => {
      if (!cancelled) {
        setAuthenticated(isAuthenticated);
        setCheckingSession(false);
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener(
        "starehe-admin-session-expired",
        handleExpiredSession
      );
    };
  }, []);

  async function handleSignIn(event) {
    event.preventDefault();
    setError("");
    setSigningIn(true);

    try {
      await signInAdmin(password);
      setAuthenticated(true);
      setPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSigningIn(false);
    }
  }

  function handleSignOut() {
    signOutAdmin();
    setAuthenticated(false);
    setMenuOpen(false);
    setError("");
  }

  if (checkingSession) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f5f7",
          color: "#071a4a",
          fontFamily: "sans-serif",
        }}
      >
        Checking admin sign-in...
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "24px",
          background: "#f4f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <form
          onSubmit={handleSignIn}
          style={{
            width: "min(100%, 420px)",
            padding: "36px",
            background: "#ffffff",
            borderRadius: "10px",
            boxShadow: "0 12px 36px rgba(7, 26, 74, 0.12)",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              color: "#c62828",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "1.5px",
            }}
          >
            STAREHE FC
          </p>

          <h1
            style={{
              margin: "0 0 8px",
              color: "#071a4a",
              fontSize: "28px",
            }}
          >
            Admin sign in
          </h1>

          <p style={{ margin: "0 0 24px", color: "#596273" }}>
            Enter the club admin password to continue.
          </p>

          <label
            htmlFor="admin-password"
            style={{
              display: "block",
              marginBottom: "8px",
              color: "#071a4a",
              fontWeight: 700,
            }}
          >
            Admin password
          </label>

          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            style={{
              boxSizing: "border-box",
              width: "100%",
              padding: "12px",
              border: "1px solid #cbd0d8",
              borderRadius: "5px",
              fontSize: "16px",
            }}
          />

          {error && (
            <p
              role="alert"
              style={{ margin: "14px 0 0", color: "#b42318" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={signingIn}
            style={{
              width: "100%",
              marginTop: "20px",
              padding: "13px",
              border: 0,
              borderRadius: "5px",
              background: "#071a4a",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: signingIn ? "wait" : "pointer",
            }}
          >
            {signingIn ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  const toggleMenu = () => {
    setMenuOpen((current) => !current);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <div className="admin-layout">
      <AdminSidebar menuOpen={menuOpen} closeMenu={closeMenu} onSignOut={handleSignOut} />

      <div className="admin-main">
        <header className="admin-topbar">
          <button
            type="button"
            className="admin-menu-button"
            onClick={toggleMenu}
            aria-label="Open admin menu"
            aria-expanded={menuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="admin-topbar-title">
            <span>STAREHE FC</span>
            <strong>Admin Panel</strong>
          </div>

          <div className="admin-user">
            <div className="admin-user-avatar">{adminProfile.display_name.charAt(0)}</div>

            <div className="admin-user-info">
              <strong>{adminProfile.display_name}</strong>
              <span>{adminProfile.role}</span>
            </div>

            <button
              type="button"
              className="admin-logout"
              onClick={handleSignOut}
            >
              Logout
            </button>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;