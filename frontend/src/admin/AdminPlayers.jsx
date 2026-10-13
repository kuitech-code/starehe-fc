import { useEffect, useState } from "react";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000")
  .replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/players`;
const PHOTO_UPLOAD_URL = `${API_ORIGIN}/api/uploads/player-photo`;

const emptyForm = {
  name: "",
  number: "",
  position: "Goalkeeper",
  photoUrl: "",
  photoFile: null,
};

const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];
const allowedPhotoTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

async function requestPlayers(path = "", options = {}) {
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
    throw new Error("Could not reach the backend. Please try again.");
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

async function uploadPlayerPhoto(file) {
  const body = new FormData();
  body.append("image", file);

  let response;

  try {
    response = await fetch(PHOTO_UPLOAD_URL, {
      method: "POST",
      body,
    });
  } catch {
    throw new Error("Could not reach the backend to upload the photo.");
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || "The photo upload failed.");
  }

  return data.imageUrl;
}

function fromApi(player) {
  return {
    id: player.id,
    name: player.full_name,
    number: player.shirt_number,
    position: player.position,
    photoUrl: player.photo_url || "",
  };
}

function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [pageError, setPageError] = useState("");
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    requestPlayers()
      .then((data) => {
        if (!Array.isArray(data)) {
          throw new Error("The players API returned an unexpected response.");
        }
        if (!cancelled) setPlayers(data.map(fromApi));
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
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError("");
    setPageError("");
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) return;

    if (!allowedPhotoTypes.has(file.type)) {
      setError("Choose a JPG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Choose an image that is 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setFormData((current) => ({
      ...current,
      photoFile: file,
      photoUrl: "",
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

  const handleEdit = (player) => {
    setFormData({
      name: player.name,
      number: String(player.number),
      position: player.position,
      photoUrl: player.photoUrl || "",
      photoFile: null,
    });
    setEditingId(player.id);
    setError("");
    setPageError("");
    setShowForm(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = formData.name.trim();
    const number = Number(formData.number);

    if (!name) {
      setError("Please enter the player's name.");
      return;
    }

    if (!Number.isInteger(number) || number < 1 || number > 99) {
      setError("Shirt number must be a whole number from 1 to 99.");
      return;
    }

    setSaving(true);
    setError("");
    setPageError("");

    try {
      let photoUrl = formData.photoUrl.trim();

      if (formData.photoFile) {
        photoUrl = await uploadPlayerPhoto(formData.photoFile);
      }

      const payload = {
        full_name: name,
        shirt_number: number,
        position: formData.position,
        photo_url: photoUrl || null,
      };

      const saved = await requestPlayers(
        editingId === null ? "" : `/${editingId}`,
        {
          method: editingId === null ? "POST" : "PUT",
          body: JSON.stringify(payload),
        },
      );

      const player = fromApi(saved);

      setPlayers((current) => {
        const next = editingId === null
          ? [...current, player]
          : current.map((item) => item.id === editingId ? player : item);
        return next.sort((a, b) => a.number - b.number);
      });

      closeForm();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (player) => {
    const confirmed = window.confirm(`Remove ${player.name} from the squad?`);
    if (!confirmed) return;

    setPageError("");

    try {
      await requestPlayers(`/${player.id}`, { method: "DELETE" });
      setPlayers((current) => current.filter((item) => item.id !== player.id));
    } catch (err) {
      setPageError(err.message);
    }
  };

  const filteredPlayers = players
    .filter((player) =>
      player.name.toLowerCase().includes(search.toLowerCase().trim())
    )
    .filter((player) =>
      positionFilter === "All" || player.position === positionFilter
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

      {pageError && (
        <p className="admin-form-error" role="alert">{pageError}</p>
      )}

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
              <h2>{editingId !== null ? "Edit player" : "Add player"}</h2>
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
                  maxLength={120}
                  required
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="player-photo-url">Photo URL</label>
                <input
                  id="player-photo-url"
                  name="photoUrl"
                  type="url"
                  value={formData.photoUrl}
                  onChange={handleChange}
                  placeholder="https://example.com/player.jpg"
                />
              </div>

              <div className="admin-form-group">
                <label htmlFor="player-photo-file">Or upload a photo</label>
                <input
                  id="player-photo-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handlePhotoChange}
                />
                <small>
                  JPG, PNG, WebP, or GIF, up to 5 MB.
                  Uploading a file replaces the Photo URL.
                </small>
                {formData.photoFile && (
                  <small>Selected: {formData.photoFile.name}</small>
                )}
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
                    : "Add Player"}
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

        {loading ? (
          <div className="admin-empty-state">
            <strong>Loading players...</strong>
          </div>
        ) : filteredPlayers.length === 0 ? (
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
                    {player.photoUrl ? (
                      <>
                        <img
                          src={player.photoUrl}
                          alt={player.name}
                          onError={(event) => {
                            event.currentTarget.hidden = true;
                            const fallback = event.currentTarget.nextElementSibling;
                            if (fallback) fallback.hidden = false;
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: "inherit",
                          }}
                        />
                        <span hidden>{player.number}</span>
                      </>
                    ) : (
                      player.number
                    )}
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