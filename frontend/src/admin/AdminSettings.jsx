import { useEffect, useState } from "react";
import { signOutAdmin } from "./adminAuth";

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

function AdminSettings() {
  const [profile, setProfile] = useState({
    display_name: "",
    role: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordChangeEnabled, setPasswordChangeEnabled] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_ORIGIN}/api/admin/password-change-status`)
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((data) => {
        if (!cancelled) setPasswordChangeEnabled(data.enabled === true);
      })
      .catch(() => {
        if (!cancelled) setPasswordChangeEnabled(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_ORIGIN}/api/admin/profile`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || "Could not load admin profile.");
        }
        return data;
      })
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((error) => {
        if (!cancelled) setProfileError(error.message);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    setProfileSaving(true);

    try {
      const response = await fetch(`${API_ORIGIN}/api/admin/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not save admin profile.");
      }

      setProfile(data);
      setProfileMessage("Admin profile saved.");
      window.dispatchEvent(
        new CustomEvent("starehe-admin-profile-updated", { detail: data })
      );
    } catch (error) {
      setProfileError(error.message || "Could not reach the backend.");
    } finally {
      setProfileSaving(false);
    }
  }

  async function changePassword(event) {
    event.preventDefault();
    setPasswordError("");
    setPasswordChanged(false);

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passwords do not match.");
      return;
    }

    setPasswordSaving(true);

    try {
      const response = await fetch(`${API_ORIGIN}/api/admin/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Could not change the password.");
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordChanged(true);
    } catch (error) {
      setPasswordError(error.message || "Could not reach the backend.");
    } finally {
      setPasswordSaving(false);
    }
  }

  function returnToSignIn() {
    signOutAdmin();
    window.location.reload();
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">ACCOUNT</p>
          <h1>Settings</h1>
          <p>Manage the club admin profile and login password.</p>
        </div>
      </div>

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div>
            <p className="admin-eyebrow">PROFILE</p>
            <h2>Admin information</h2>
          </div>
        </div>

        {profileLoading ? (
          <p role="status">Loading profile...</p>
        ) : (
          <form onSubmit={saveProfile}>
            <div className="admin-form-group">
              <label htmlFor="admin-display-name">Display name</label>
              <input
                id="admin-display-name"
                type="text"
                maxLength={100}
                value={profile.display_name}
                onChange={(event) =>
                  setProfile({ ...profile, display_name: event.target.value })
                }
                required
              />
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-role">Role</label>
              <input
                id="admin-role"
                type="text"
                maxLength={80}
                value={profile.role}
                onChange={(event) =>
                  setProfile({ ...profile, role: event.target.value })
                }
                required
              />
            </div>

            {profileError && (
              <p className="admin-form-error" role="alert">
                {profileError}
              </p>
            )}
            {profileMessage && <p role="status">{profileMessage}</p>}

            <div className="admin-form-actions">
              <button
                type="submit"
                className="admin-primary-button"
                disabled={profileSaving || profileLoading}
              >
                {profileSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div>
            <p className="admin-eyebrow">ADMIN LOGIN</p>
            <h2>Password</h2>
          </div>
        </div>

        {passwordChangeEnabled ? (
          passwordChanged ? (
            <div>
              <p role="status">
                Password changed. Sign in again with your new password.
              </p>
              <button
                type="button"
                className="admin-primary-button"
                onClick={returnToSignIn}
              >
                Sign in with the new password
              </button>
            </div>
          ) : (
            <form onSubmit={changePassword}>
              <div className="admin-form-group">
                <label htmlFor="current-admin-password">Current password</label>
                <input
                  id="current-admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="new-admin-password">New password</label>
                <input
                  id="new-admin-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                />
                <small>Use at least 12 characters.</small>
              </div>

              <div className="admin-form-group">
                <label htmlFor="confirm-admin-password">
                  Confirm new password
                </label>
                <input
                  id="confirm-admin-password"
                  type="password"
                  autoComplete="new-password"
                  minLength={12}
                  maxLength={128}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                />
              </div>

              {passwordError && (
                <p className="admin-form-error" role="alert">
                  {passwordError}
                </p>
              )}

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="admin-primary-button"
                  disabled={passwordSaving}
                >
                  {passwordSaving ? "Saving..." : "Change password"}
                </button>
              </div>
            </form>
          )
        ) : (
          <p>Password changes are locked.</p>
        )}
      </section>
    </div>
  );
}

export default AdminSettings;