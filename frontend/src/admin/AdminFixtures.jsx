import { useEffect, useState } from "react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/fixtures`;

const emptyForm = {
  date: "",
  time: "",
  opponent: "",
  venue: "",
  competition: "League Match",
  home: true,
};

async function requestFixtures(path = "", options = {}) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the backend. Make sure it is running on port 5000.");
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const details = Array.isArray(data.details)
      ? ` ${data.details.join(". ")}.`
      : "";
    throw new Error(`${data.error || "The request failed."}${details}`);
  }

  return data;
}

function fromApi(fixture) {
  return {
    id: fixture.id,
    date: fixture.match_date,
    time: fixture.kickoff_time ? fixture.kickoff_time.slice(0, 5) : "",
    opponent: fixture.opponent,
    venue: fixture.venue || "",
    competition: fixture.competition || "League Match",
    home: fixture.is_home,
    status: fixture.status,
  };
}

function AdminFixtures() {
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    requestFixtures()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The fixtures API returned an unexpected response.");
        }
        if (!cancelled) setFixtures(data.map(fromApi));
      })
      .catch((err) => {
        if (!cancelled) setPageError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const resetForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
    setPageError("");
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
    setPageError("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const opponent = formData.opponent.trim();
    const venue = formData.venue.trim();

    if (!opponent || !formData.date || !venue) {
      setError("Please enter the date, opponent, and venue.");
      return;
    }

    const payload = {
      opponent,
      match_date: formData.date,
      kickoff_time: formData.time || null,
      venue,
      competition: formData.competition.trim() || null,
      is_home: formData.home,
    };

    setSaving(true);
    setError("");
    setPageError("");

    try {
      const saved = await requestFixtures(
        editingId === null ? "" : `/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      );
      const fixture = fromApi(saved);

      setFixtures((current) => {
        const next = editingId === null
          ? [...current, fixture]
          : current.map((item) => item.id === editingId ? fixture : item);
        return next.sort((a, b) =>
          `${a.date}T${a.time || "23:59"}`.localeCompare(
            `${b.date}T${b.time || "23:59"}`
          )
        );
      });
      resetForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (fixture) => {
    setFormData({
      date: fixture.date,
      time: fixture.time,
      opponent: fixture.opponent,
      venue: fixture.venue,
      competition: fixture.competition,
      home: fixture.home,
    });
    setEditingId(fixture.id);
    setError("");
    setPageError("");
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this fixture?");
    if (!confirmed) return;

    setPageError("");
    try {
      await requestFixtures(`/${id}`, { method: "DELETE" });
      setFixtures((current) => current.filter((fixture) => fixture.id !== id));
    } catch (err) {
      setPageError(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <p className="admin-eyebrow">MATCH MANAGEMENT</p>
          <h1>Fixtures</h1>
          <p>Create and manage upcoming Starehe FC fixtures.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openNewForm}
        >
          + Add Fixture
        </button>
      </div>

      {pageError && (
        <p className="admin-form-error" role="alert">{pageError}</p>
      )}

      {showForm && (
        <section className="admin-form-card">
          <div className="admin-form-header">
            <div>
              <p className="admin-eyebrow">
                {editingId !== null ? "EDIT FIXTURE" : "NEW FIXTURE"}
              </p>
              <h2>{editingId !== null ? "Edit fixture" : "Add fixture"}</h2>
            </div>

            <button
              type="button"
              className="admin-close-button"
              onClick={resetForm}
              aria-label="Close form"
              disabled={saving}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="fixture-date">Match Date</label>
                <input
                  id="fixture-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="fixture-time">Kickoff Time</label>
                <input
                  id="fixture-time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="fixture-opponent">Opponent</label>
                <input
                  id="fixture-opponent"
                  name="opponent"
                  type="text"
                  placeholder="e.g. Murai FC"
                  value={formData.opponent}
                  onChange={handleChange}
                  maxLength={120}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="fixture-venue">Venue</label>
                <input
                  id="fixture-venue"
                  name="venue"
                  type="text"
                  placeholder="e.g. Starehe Grounds"
                  value={formData.venue}
                  onChange={handleChange}
                  maxLength={200}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="fixture-competition">Competition</label>
                <select
                  id="fixture-competition"
                  name="competition"
                  value={formData.competition}
                  onChange={handleChange}
                >
                  <option>League Match</option>
                  <option>Cup Match</option>
                  <option>Friendly</option>
                  <option>Tournament</option>
                </select>
              </div>

              <div className="admin-form-group admin-checkbox-group">
                <label htmlFor="fixture-home">
                  <input
                    id="fixture-home"
                    name="home"
                    type="checkbox"
                    checked={formData.home}
                    onChange={handleChange}
                  />
                  <span>Starehe FC is playing at home</span>
                </label>
              </div>
            </div>

            {error && (
              <p className="admin-form-error" role="alert">{error}</p>
            )}

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Save Changes"
                    : "Create Fixture"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-fixtures-list">
        <div className="admin-list-header">
          <div>
            <p className="admin-eyebrow">SCHEDULE</p>
            <h2>Upcoming Fixtures</h2>
          </div>

          <span className="admin-count">{fixtures.length} fixtures</span>
        </div>

        {loading ? (
          <div className="admin-empty-state">
            <strong>Loading fixtures...</strong>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No fixtures yet.</strong>
            <p>Add the first fixture using the button above.</p>
          </div>
        ) : (
          <div className="admin-fixture-list">
            {fixtures.map((fixture) => (
              <article className="admin-fixture-card" key={fixture.id}>
                <div className="admin-fixture-date">
                  <span>{formatDate(fixture.date)}</span>
                  <strong>{fixture.time || "Time TBC"}</strong>
                </div>

                <div className="admin-fixture-match">
                  <div>
                    <span>STAREHE FC</span>
                    <strong>VS</strong>
                    <span>{fixture.opponent}</span>
                  </div>

                  <p>
                    {fixture.home ? "HOME" : "AWAY"} · {fixture.venue}
                  </p>

                  <small>{fixture.competition}</small>
                </div>

                <div className="admin-fixture-actions">
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => handleEdit(fixture)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(fixture.id)}
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminFixtures;

