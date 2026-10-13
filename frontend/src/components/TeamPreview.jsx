import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchApiList, imageSource } from "../api";

function TeamPreview() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/players", "players")
      .then((data) => {
        if (!cancelled) {
          setPlayers(
            data
              .filter((player) => player.is_active !== false)
              .slice(0, 4)
          );
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="team-section">
      <div className="section-container">
        <div className="results-header">
          <div className="section-heading">
            <p className="section-eyebrow">THE SQUAD</p>
            <h2>Meet the team.</h2>
          </div>
          <Link to="/team" className="results-link">
            View Full Squad →
          </Link>
        </div>

        {loading ? (
          <p role="status">Loading the team...</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : players.length === 0 ? (
          <p>No active players have been added yet.</p>
        ) : (
          <div className="players-grid">
            {players.map((player) => (
              <article className="player-card" key={player.id}>
                <div
                  className="player-image"
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {player.photo_url ? (
                    <img
                      src={imageSource(player.photo_url)}
                      alt={player.full_name}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : null}
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {player.shirt_number}
                  </span>
                </div>

                <div className="player-info">
                  <span>{player.position}</span>
                  <h3>{player.full_name}</h3>
                  <p>#{player.shirt_number}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TeamPreview;