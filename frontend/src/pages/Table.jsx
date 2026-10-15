import { useEffect, useState } from "react";
import ClubBadge from "../components/ClubBadge";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/table/standings`;
const fkfStandings = [
  { team: "Ndaragwa Young Stars", played: 12, goalDifference: 25, points: 29 },
  { team: "Starehe FC", played: 12, goalDifference: 6, points: 23 },
  { team: "Ivory FC", played: 12, goalDifference: 14, points: 22 },
  { team: "Muruai FC", played: 12, goalDifference: -4, points: 12 },
  { team: "110 FC", played: 12, goalDifference: -4, points: 11 },
  { team: "Sparrow FC", played: 12, goalDifference: -20, points: 11 },
  { team: "Sparks United", played: 12, goalDifference: -17, points: 8 },
];

function Table() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(API_URL)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not load the league table.");
        if (!Array.isArray(data)) throw new Error("The league table service returned an unexpected response.");
        return data;
      })
      .then((data) => { if (!cancelled) setTeams(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className="table-page">
      <section className="page-hero">
        <div className="section-container">
          <p className="section-eyebrow">STAREHE FC</p>
          <h1>League Table</h1>
          <p>Follow the race for the top of the table.</p>
        </div>
      </section>

      <section className="table-page-content faded-background">
        <div className="section-container">
          <div className="table-page-heading">
            <p className="section-eyebrow">CURRENT STANDINGS</p>
            <h2>League Table</h2>
            <p>Standings calculated from the league matches entered by the club.</p>
          </div>

          {loading ? (
            <p role="status">Loading league table...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : teams.length === 0 ? (
            <p>The league table will appear here once teams are added.</p>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="league-table">
                  <thead>
                    <tr><th>POS</th><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th></tr>
                  </thead>
                  <tbody>
                    {teams.map((team, index) => (
                      <tr key={team.team} className={team.team.toLowerCase() === "starehe fc" ? "current-team" : ""}>
                        <td className="position">{index + 1}</td>
                        <td className="table-team"><span className="table-team-label"><ClubBadge src={team.logo_url} name={team.team} size="small" />{team.team}</span></td>
                        <td>{team.played}</td><td>{team.won}</td><td>{team.drawn}</td><td>{team.lost}</td>
                        <td>{team.goals_for}</td><td>{team.goals_against}</td>
                        <td>{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                        <td className="points">{team.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="table-key">
                <span><strong>P</strong> Played</span><span><strong>W</strong> Won</span><span><strong>D</strong> Drawn</span><span><strong>L</strong> Lost</span>
                <span><strong>GF</strong> Goals For</span><span><strong>GA</strong> Goals Against</span><span><strong>GD</strong> Goal Difference</span><span><strong>PTS</strong> Points</span>
              </div>
            </>
          )}

          <section className="fkf-standings-section" aria-labelledby="fkf-standings-title">
            <div className="fkf-standings-heading">
              <div>
                <p className="section-eyebrow">OFFICIAL FKF TABLE</p>
                <h2 id="fkf-standings-title">Nyandarua County League 2025/2026 Zone C</h2>
                <p>Official standings from FKF Leagues.</p>
              </div>
              <a
                className="fkf-standings-button"
                href="https://www.fkfleagues.co.ke/standings/nyandarua2526c"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open full table on FKF
              </a>
            </div>
            <div className="table-wrapper fkf-table-wrapper">
              <table className="league-table fkf-league-table">
                <thead>
                  <tr><th>POS</th><th>TEAM</th><th>P</th><th>GD</th><th>PTS</th></tr>
                </thead>
                <tbody>
                  {fkfStandings.map((team, index) => (
                    <tr key={team.team} className={team.team === "Starehe FC" ? "current-team" : ""}>
                      <td className="position">{index + 1}</td>
                      <td className="table-team">{team.team}</td>
                      <td>{team.played}</td>
                      <td>{team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}</td>
                      <td className="points">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="fkf-standings-note">
              FKF standings snapshot. Use the button above to check the latest official table.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}

export default Table;
