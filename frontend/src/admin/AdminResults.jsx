import { useEffect, useState } from "react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/results`;

const emptyForm = {
  date: "",
  opponent: "",
  homeScore: "",
  awayScore: "",
  home: true,
  venue: "",
  competition: "League Match",
};

async function requestResults(path = "", options = {}) {
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

function fromApi(result) {
  return {
    id: result.id,
    date: result.match_date,
    opponent: result.opponent,
    homeScore: result.starehe_score,
    awayScore: result.opponent_score,
    home: result.is_home,
    venue: result.venue || "",
    competition: result.competition || "League Match",
  };
}

function AdminResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    let cancelled = false;

    requestResults()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The results API returned an unexpected response.");
        }
        if (!cancelled) setResults(data.map(fromApi));
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
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
    setPageError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
    setError("");
  };

  const handleEdit = (result) => {
    setFormData({
      date: result.date,
      opponent: result.opponent,
      homeScore: String(result.homeScore),
      awayScore: String(result.awayScore),
      home: result.home,
      venue: result.venue,
      competition: result.competition,
    });
    setEditingId(result.id);
    setError("");
    setPageError("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const opponent = formData.opponent.trim();
    const venue = formData.venue.trim();
    const stareheScore = Number(formData.homeScore);
    const opponentScore = Number(formData.awayScore);

    if (!formData.date || !opponent || !venue) {
      setError("Please enter the date, opponent, and venue.");
      return;
    }

    if (
      formData.homeScore === "" ||
      formData.awayScore === "" ||
      !Number.isInteger(stareheScore) ||
      !Number.isInteger(opponentScore) ||
      stareheScore < 0 ||
      opponentScore < 0 ||
      stareheScore > 32767 ||
      opponentScore > 32767
    ) {
      setError("Scores must be whole numbers from 0 to 32767.");
      return;
    }

    const payload = {
      match_date: formData.date,
      opponent,
      starehe_score: stareheScore,
      opponent_score: opponentScore,
      is_home: formData.home,
      venue,
      competition: formData.competition,
    };

    setSaving(true);
    setError("");
    setPageError("");

    try {
      const saved = await requestResults(
        editingId === null ? "" : `/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      );
      const result = fromApi(saved);

      setResults((current) => {
        const next = editingId === null
          ? [...current, result]
          : current.map((item) => item.id === editingId ? result : item);
        return next.sort((a, b) => b.date.localeCompare(a.date));
      });
      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this match result?")) return;

    setPageError("");
    try {
      await requestResults(`/${id}`, { method: "DELETE" });
      setResults((current) => current.filter((result) => result.id !== id));
    } catch (err) {
      setPageError(err.message);
    }
  };

  const getOutcome = (result) => {
    if (result.homeScore > result.awayScore) return "W";
    if (result.homeScore < result.awayScore) return "L";
    return "D";
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
          <h1>Results</h1>
          <p>Record scores and manage completed matches.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openNewForm}
        >
          + Add Result
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
                {editingId !== null ? "EDIT RESULT" : "NEW RESULT"}
              </p>
              <h2>{editingId !== null ? "Edit result" : "Record result"}</h2>
            </div>

            <button
              type="button"
              className="admin-close-button"
              onClick={closeForm}
              aria-label="Close form"
              disabled={saving}
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="result-date">Match Date</label>
                <input
                  id="result-date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="result-opponent">Opponent</label>
                <input
                  id="result-opponent"
                  name="opponent"
                  value={formData.opponent}
                  onChange={handleChange}
                  placeholder="e.g. Murai FC"
                  maxLength={120}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="home-score">Starehe FC score</label>
                <input
                  id="home-score"
                  name="homeScore"
                  type="number"
                  min="0"
                  max="32767"
                  step="1"
                  value={formData.homeScore}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="away-score">Opponent score</label>
                <input
                  id="away-score"
                  name="awayScore"
                  type="number"
                  min="0"
                  max="32767"
                  step="1"
                  value={formData.awayScore}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="result-venue">Venue</label>
                <input
                  id="result-venue"
                  name="venue"
                  value={formData.venue}
                  onChange={handleChange}
                  placeholder="Match venue"
                  maxLength={200}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="result-competition">Competition</label>
                <select
                  id="result-competition"
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
                <label htmlFor="result-home">
                  <input
                    id="result-home"
                    name="home"
                    type="checkbox"
                    checked={formData.home}
                    onChange={handleChange}
                  />
                  <span>Starehe FC played at home</span>
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
                onClick={closeForm}
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
                    : "Save Result"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-fixtures-list">
        <div className="admin-list-header">
          <div>
            <p className="admin-eyebrow">MATCH HISTORY</p>
            <h2>Recorded Results</h2>
          </div>

          <span className="admin-count">{results.length} results</span>
        </div>

        {loading ? (
          <div className="admin-empty-state">
            <strong>Loading results...</strong>
          </div>
        ) : results.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No results recorded yet.</strong>
            <p>Use Add Result to record a completed match.</p>
          </div>
        ) : (
          <div className="admin-fixture-list">
            {results.map((result) => {
              const outcome = getOutcome(result);
              const leftScore = result.home ? result.homeScore : result.awayScore;
              const rightScore = result.home ? result.awayScore : result.homeScore;

              return (
                <article className="admin-fixture-card" key={result.id}>
                  <div className="admin-fixture-date">
                    <span>{formatDate(result.date)}</span>
                    <strong>{result.competition}</strong>
                  </div>

                  <div className="admin-result-match">
                    <span className={`admin-outcome outcome-${outcome.toLowerCase()}`}>
                      {outcome === "W" ? "WIN" : outcome === "D" ? "DRAW" : "LOSS"}
                    </span>

                    <div className="admin-result-scoreline">
                      <span>{result.home ? "STAREHE FC" : result.opponent}</span>
                      <strong>{leftScore} - {rightScore}</strong>
                      <span>{result.home ? result.opponent : "STAREHE FC"}</span>
                    </div>

                    <p>{result.venue}</p>
                  </div>

                  <div className="admin-fixture-actions">
                    <button
                      type="button"
                      className="admin-edit-button"
                      onClick={() => handleEdit(result)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="admin-delete-button"
                      onClick={() => handleDelete(result.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminResults;

