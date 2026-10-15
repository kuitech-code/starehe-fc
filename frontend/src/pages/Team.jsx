import { useEffect, useState } from "react";
import { fetchApiList, imageSource } from "../api";

const positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"];

function Team() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topScorers, setTopScorers] = useState([]);
  const [scorersLoading, setScorersLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetchApiList("/api/players", "players")
      .then((data) => {
        if (!cancelled) {
          setPlayers(data.filter((player) => player.is_active !== false));
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

  useEffect(() => {
    let cancelled = false;
    fetchApiList("/api/top-scorers", "top scorers")
      .then((data) => { if (!cancelled) setTopScorers(data); })
      .catch(() => { if (!cancelled) setTopScorers([]); })
      .finally(() => { if (!cancelled) setScorersLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="team-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>The Team</h1>
          <p>Meet the players representing Starehe FC.</p>
        </div>
      </section>

      <section className="top-scorers-section">
        <div className="section-container">
          <div className="top-scorers-heading">
            <div><p className="section-eyebrow">NYANDARUA COUNTY LEAGUE</p><h2>Top Scorers</h2></div>
            <a className="team-fkf-link" href="https://www.fkfleagues.co.ke/team/4221/Starehe-FC" target="_blank" rel="noreferrer">Official FKF team profile <span aria-hidden="true">↗</span></a>
          </div>
          {scorersLoading ? <p role="status">Loading top scorers...</p> : topScorers.length === 0 ? <p>Top scorer statistics will appear here when the club adds them.</p> : (
            <ol className="top-scorers-list">{topScorers.map((scorer, index) => <li key={scorer.player_id}><span className="top-scorer-rank">{String(index + 1).padStart(2, "0")}</span><div><strong>{scorer.full_name}</strong><small>#{scorer.shirt_number}</small></div><strong className="top-scorer-goals">{scorer.goals}<small>{scorer.goals === 1 ? "GOAL" : "GOALS"}</small></strong></li>)}</ol>
          )}
        </div>
      </section>

      <section className="team-page-content">
        <div className="section-container">
          {loading ? (
            <p role="status">Loading the team...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : players.length === 0 ? (
            <p>No active players have been added yet.</p>
          ) : (
            positions.map((position) => {
              const positionPlayers = players.filter(
                (player) => player.position === position
              );

              if (!positionPlayers.length) return null;

              return (
                <section className="squad-group" key={position}>
                  <div className="squad-heading">
                    <p className="section-eyebrow">THE SQUAD</p>
                    <h2>{position}s</h2>
                  </div>

                  <div className="squad-grid">
                    {positionPlayers.map((player) => {
                      const name = player.full_name || "Player";

                      return (
                        <article
                          className="squad-player-card"
                          key={player.id}
                        >
                          <div className="squad-player-image">
                            {player.photo_url ? (
                              <img
                                src={imageSource(player.photo_url)}
                                alt={name}
                              />
                            ) : (
                              <div className="player-photo-placeholder">
                                <span>{player.shirt_number}</span>
                              </div>
                            )}
                            <div className="player-number">
                              {player.shirt_number}
                            </div>
                          </div>

                          <div className="squad-player-info">
                            <span>{player.position}</span>
                            <h3>{name}</h3>
                            <p>#{player.shirt_number}</p>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}

export default Team;
