
import { useState } from "react";

const initialPlayers = [
  { id: 1, name: "Brian Mwangi", number: 1, position: "Goalkeeper" },
  { id: 2, name: "Peter Kamau", number: 22, position: "Goalkeeper" },
  { id: 3, name: "Kevin Kariuki", number: 5, position: "Defender" },
  { id: 4, name: "John Maina", number: 3, position: "Defender" },
  { id: 5, name: "Dennis Njoroge", number: 4, position: "Defender" },
  { id: 6, name: "Eric Wambui", number: 2, position: "Defender" },
  { id: 7, name: "David Maina", number: 8, position: "Midfielder" },
  { id: 8, name: "Samuel Kariuki", number: 6, position: "Midfielder" },
  { id: 9, name: "James Mwangi", number: 10, position: "Midfielder" },
  { id: 10, name: "Martin Ndirangu", number: 7, position: "Midfielder" },
  { id: 11, name: "Samuel Njoroge", number: 9, position: "Forward" },
  { id: 12, name: "Alex Kariuki", number: 11, position: "Forward" },
  { id: 13, name: "Victor Maina", number: 17, position: "Forward" },
];

const emptyForm = {
  name: "",
  number: "",
  position: "Goalkeeper",
};

const positions = [
  "Goalkeeper",
  "Defender",
  "Midfielder",
  "Forward",
];

function AdminPlayers() {
  const [players, setPlayers] = useState(initialPlayers);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
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

  const handleEdit = (player) => {
    setFormData({
      name: player.name,
      number: String(player.number),
      position: player.position,
    });

    setEditingId(player.id);
    setError("");
    setShowForm(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const number = Number(formData.number);

    if (!name) {
      setError("Please enter the player's name.");
      return;
    }

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 99
    ) {
      setError("Shirt number must be a whole number from 1 to 99.");
      return;
    }

    const duplicateNumber = players.some(
      (player) =>
        player.number === number &&
        player.id !== editingId
    );

    if (duplicateNumber) {
      setError("That shirt number is already assigned to another player.");
      return;
    }

    const updatedPlayer = {
      name,
      number,
      position: formData.position,
    };

    if (editingId !== null) {
      setPlayers((current) =>
        current.map((player) =>
          player.id === editingId
            ? { ...player, ...updatedPlayer }
            : player
        )
      );
    } else {
      setPlayers((current) => [
        ...current,
        {
          id: Date.now(),
          ...updatedPlayer,
        },
      ]);
    }

    closeForm();
  };

  const handleDelete = (player) => {
    const confirmed = window.confirm(
      `Remove ${player.name} from the squad?`
    );

    if (!confirmed) return;

    setPlayers((current) =>
      current.filter((item) => item.id !== player.id)
    );
  };

  const filteredPlayers = players
    .filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase().trim())
    )
    .filter(
      (player) =>
        positionFilter === "All" ||
        player.position === positionFilter
    )
    .sort((a, b) => a.number - b.number);

  const positionCounts = positions.reduce((counts, position) => {
    counts[position] = players.filter(
      (player) => player.position === position
    ).length;

    return counts;
  }, {});

  return (
    <div className="admin-page">
      <div className="admin-page-header admin-page-header-row">
        <div>
          <p className="admin-eyebrow">SQUAD MANAGEMENT</p>
          <h1>Players</h1>
          <p>Manage your squad and shirt numbers.</p>
        </div>

        <button
          type="button"
          className="admin-primary-button"
          onClick={openNewForm}
        >
          + Add Player
        </button>
      </div>

      <section className="admin-player-stats">
        <article>
          <span>Total Squad</span>
          <strong>{players.length}</strong>
        </article>

        {positions.map((position) => (
          <article key={position}>
            <span>{position}s</span>
            <strong>{positionCounts[position]}</strong>
          </article>
        ))}
      </section>

      {showForm && (
        <section className="admin-form-card">
          <div className="admin-form-header">
            <div>
              <p className="admin-eyebrow">
                {editingId !== null ? "EDIT PLAYER" : "NEW PLAYER"}
              </p>
              <h2>
                {editingId !== null ? "Edit player" : "Add player"}
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
                <label htmlFor="player-name">Full Name</label>
                <input
                  id="player-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Brian Mwangi"
                  maxLength={100}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="player-number">Shirt Number</label>
                <input
                  id="player-number"
                  name="number"
                  type="number"
                  min="1"
                  max="99"
                  step="1"
                  value={formData.number}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="player-position">Position</label>
                <select
                  id="player-position"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                >
                  {positions.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
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
                {editingId !== null ? "Save Changes" : "Add Player"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="admin-player-directory">
        <div className="admin-list-header">
          <div>
            <p className="admin-eyebrow">THE SQUAD</p>
            <h2>Player Directory</h2>
          </div>

          <span className="admin-count">
            {filteredPlayers.length} players
          </span>
        </div>

        <div className="admin-player-filters">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search players..."
            aria-label="Search players"
          />

          <select
            value={positionFilter}
            onChange={(event) => setPositionFilter(event.target.value)}
            aria-label="Filter players by position"
          >
            <option value="All">All Positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}s
              </option>
            ))}
          </select>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="admin-empty-state">
            <strong>No players found.</strong>
            <p>Try another search or add a new player.</p>
          </div>
        ) : (
          <div className="admin-players-grid">
            {filteredPlayers.map((player) => (
              <article className="admin-player-card" key={player.id}>
                <div className="admin-player-card-top">
                  <div className="admin-player-avatar">
                    {player.number}
                  </div>

                  <span className="admin-player-position">
                    {player.position}
                  </span>
                </div>

                <div className="admin-player-card-info">
                  <span>PLAYER #{player.number}</span>
                  <h3>{player.name}</h3>
                </div>

                <div className="admin-player-actions">
                  <button
                    type="button"
                    className="admin-edit-button"
                    onClick={() => handleEdit(player)}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    className="admin-delete-button"
                    onClick={() => handleDelete(player)}
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

export default AdminPlayers;
