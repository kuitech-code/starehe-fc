import { useState } from "react";

function AdminFixtures() {
  const [fixtures, setFixtures] = useState([
    {
      id: 1,
      date: "2026-10-18",
      time: "15:00",
      opponent: "Murai FC",
      venue: "Starehe Grounds",
      competition: "League Match",
      home: true,
    },
    {
      id: 2,
      date: "2026-10-25",
      time: "14:00",
      opponent: "Ndaragwa United",
      venue: "Ndaragwa Stadium",
      competition: "League Match",
      home: false,
    },
    {
      id: 3,
      date: "2026-11-01",
      time: "15:30",
      opponent: "Nyeri City",
      venue: "Starehe Grounds",
      competition: "Cup Match",
      home: true,
    },
    {
      id: 4,
      date: "2026-11-08",
      time: "15:00",
      opponent: "Karatina FC",
      venue: "Karatina Stadium",
      competition: "League Match",
      home: false,
    },
  ]);

  const [showForm, setShowForm] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    date: "",
    time: "",
    opponent: "",
    venue: "",
    competition: "League Match",
    home: true,
  });

  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      opponent: "",
      venue: "",
      competition: "League Match",
      home: true,
    });

    setEditingId(null);
    setShowForm(false);
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (editingId) {
      setFixtures((current) =>
        current.map((fixture) =>
          fixture.id === editingId
            ? {
                ...fixture,
                ...formData,
              }
            : fixture
        )
      );
    } else {
      const newFixture = {
        id: Date.now(),
        ...formData,
      };

      setFixtures((current) => [
        ...current,
        newFixture,
      ]);
    }

    resetForm();
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
    setShowForm(true);
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this fixture?"
    );

    if (!confirmed) {
      return;
    }

    setFixtures((current) =>
      current.filter((fixture) => fixture.id !== id)
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

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
          <p className="admin-eyebrow">
            MATCH MANAGEMENT
          </p>

          <h1>Fixtures</h1>

          <p>
            Create and manage upcoming Starehe FC
            fixtures.
          </p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => {
            setEditingId(null);
            setFormData({
              date: "",
              time: "",
              opponent: "",
              venue: "",
              competition: "League Match",
              home: true,
            });
            setShowForm(true);
          }}
        >
          + Add Fixture
        </button>
      </div>

      {showForm && (
        <section className="admin-form-card">
          <div className="admin-form-header">
            <div>
              <p className="admin-eyebrow">
                {editingId
                  ? "EDIT FIXTURE"
                  : "NEW FIXTURE"}
              </p>

              <h2>
                {editingId
                  ? "Edit fixture"
                  : "Add fixture"}
              </h2>
            </div>

            <button
              type="button"
              className="admin-close-button"
              onClick={resetForm}
              aria-label="Close form"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="admin-form-grid">
              <div className="admin-form-group">
                <label htmlFor="date">
                  Match Date
                </label>

                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="time">
                  Kickoff Time
                </label>

                <input
                  id="time"
                  name="time"
                  type="time"
                  value={formData.time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="opponent">
                  Opponent
                </label>

                <input
                  id="opponent"
                  name="opponent"
                  type="text"
                  placeholder="e.g. Murai FC"
                  value={formData.opponent}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="venue">
                  Venue
                </label>

                <input
                  id="venue"
                  name="venue"
                  type="text"
                  placeholder="e.g. Starehe Grounds"
                  value={formData.venue}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="competition">
                  Competition
                </label>

                <select
                  id="competition"
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
                <label htmlFor="home">
                  <input
                    id="home"
                    name="home"
                    type="checkbox"
                    checked={formData.home}
                    onChange={handleChange}
                  />

                  <span>
                    Starehe FC is playing at home
                  </span>
                </label>
              </div>
            </div>

            <div className="admin-form-actions">
              <button
                type="button"
                className="admin-secondary-button"
                onClick={resetForm}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="admin-primary-button"
              >
                {editingId
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
            <p className="admin-eyebrow">
              SCHEDULE
            </p>

            <h2>Upcoming Fixtures</h2>
          </div>

          <span className="admin-count">
            {fixtures.length} fixtures
          </span>
        </div>

        {fixtures.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No fixtures yet.</strong>
            <p>
              Add the first fixture using the button
              above.
            </p>
          </div>
        ) : (
          <div className="admin-fixture-list">
            {fixtures.map((fixture) => (
              <article
                className="admin-fixture-card"
                key={fixture.id}
              >
                <div className="admin-fixture-date">
                  <span>
                    {formatDate(fixture.date)}
                  </span>

                  <strong>{fixture.time}</strong>
                </div>

                <div className="admin-fixture-match">
                  <div>
                    <span>STAREHE FC</span>
                    <strong>VS</strong>
                    <span>
                      {fixture.opponent}
                    </span>
                  </div>

                  <p>
                    {fixture.home
                      ? "HOME"
                      : "AWAY"}{" "}
                    · {fixture.venue}
                  </p>

                  <small>
                    {fixture.competition}
                  </small>
                </div>

                <div className="admin-fixture-actions">
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() =>
                      handleEdit(fixture)
                    }
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() =>
                      handleDelete(fixture.id)
                    }
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