
import { useState } from "react";

const initialResults = [
  {
    id: 1,
    date: "2026-10-12",
    opponent: "Murai FC",
    homeScore: 3,
    awayScore: 1,
    home: true,
    venue: "Starehe Grounds",
    competition: "League Match",
  },
  {
    id: 2,
    date: "2026-10-05",
    opponent: "Ndaragwa United",
    homeScore: 1,
    awayScore: 1,
    home: true,
    venue: "Starehe Grounds",
    competition: "League Match",
  },
  {
    id: 3,
    date: "2026-09-28",
    opponent: "Nyeri City",
    homeScore: 0,
    awayScore: 2,
    home: false,
    venue: "Nyeri Stadium",
    competition: "Cup Match",
  },
  {
    id: 4,
    date: "2026-09-21",
    opponent: "Karatina FC",
    homeScore: 2,
    awayScore: 0,
    home: true,
    venue: "Starehe Grounds",
    competition: "League Match",
  },
];

const emptyForm = {
  date: "",
  opponent: "",
  homeScore: "",
  awayScore: "",
  home: true,
  venue: "",
  competition: "League Match",
};

function AdminResults() {
  const [results, setResults] = useState(initialResults);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
  };

  const openNewForm = () => {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
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
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const homeScore = Number(formData.homeScore);
    const awayScore = Number(formData.awayScore);

    if (
      !Number.isInteger(homeScore) ||
      !Number.isInteger(awayScore) ||
      homeScore < 0 ||
      awayScore < 0
    ) {
      setError("Scores must be whole numbers of zero or more.");
      return;
    }

    const cleanedResult = {
      ...formData,
      opponent: formData.opponent.trim(),
      venue: formData.venue.trim(),
      homeScore,
      awayScore,
    };

    if (!cleanedResult.opponent || !cleanedResult.venue) {
      setError("Please enter the opponent and venue.");
      return;
    }

    if (editingId !== null) {
      setResults((current) =>
        current.map((result) =>
          result.id === editingId
            ? { ...result, ...cleanedResult }
            : result
        )
      );
    } else {
      setResults((current) => [
        {
          id: Date.now(),
          ...cleanedResult,
        },
        ...current,
      ]);
    }

    closeForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this match result?")) {
      return;
    }

    setResults((current) =>
      current.filter((result) => result.id !== id)
    );
  };

  const getOutcome = (result) => {
    const stareheScore = result.home
      ? result.homeScore
      : result.awayScore;

    const opponentScore = result.home
      ? result.awayScore
      : result.homeScore;

    if (stareheScore > opponentScore) return "W";
    if (stareheScore < opponentScore) return "L";
    return "D";
  };

  const formatDate = (date) => {
    if (!date) return "";

    return new Date(`${date}T00:00:00`).toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
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

      {showForm && (
        <section className="admin-form-card">
          <div className="admin-form-header">
            <div>
              <p className="admin-eyebrow">
                {editingId !== null ? "EDIT RESULT" : "NEW RESULT"}
              </p>
              <h2>
                {editingId !== null ? "Edit result" : "Record result"}
              </h2>
            </div>

            <button
              type="button"
              className="admin-close-button"
              onClick={closeForm}
              aria-label="Close form"
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
              <p className="admin-form-error" role="alert">
                {error}
              </p>
            )}

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={closeForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
              >
                {editingId !== null ? "Save Changes" : "Save Result"}
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

          <span className="admin-count">
            {results.length} results
          </span>
        </div>

        {results.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No results recorded yet.</strong>
            <p>Use Add Result to record a completed match.</p>
          </div>
        ) : (
          <div className="admin-fixture-list">
            {results.map((result) => {
              const outcome = getOutcome(result);

              return (
                <article className="admin-fixture-card" key={result.id}>
                  <div className="admin-fixture-date">
                    <span>{formatDate(result.date)}</span>
                    <strong>{result.competition}</strong>
                  </div>

                  <div className="admin-result-match">
                    <span className={`admin-outcome outcome-${outcome.toLowerCase()}`}>
                      {outcome === "W"
                        ? "WIN"
                        : outcome === "D"
                          ? "DRAW"
                          : "LOSS"}
                    </span>

                    <div className="admin-result-scoreline">
                      <span>
                        {result.home ? "STAREHE FC" : result.opponent}
                      </span>

                      <strong>
                        {result.homeScore} - {result.awayScore}
                      </strong>

                      <span>
                        {result.home ? result.opponent : "STAREHE FC"}
                      </span>
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
