import { useEffect, useState } from "react";
import ClubBadge from "../components/ClubBadge";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
const API_URL = `${API_ORIGIN}/api/table`;
const TEAM_UPLOAD_URL = `${API_ORIGIN}/api/uploads/team-logo`;

const emptyMatch = () => ({
  home_team_id: "",
  away_team_id: "",
  match_date: new Date().toISOString().slice(0, 10),
  home_score: "",
  away_score: "",
});

async function requestTable(path = "", options = {}) {
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
    const details = Array.isArray(data.details) ? ` ${data.details.join(". ")}.` : "";
    throw new Error(`${data.error || "The request failed."}${details}`);
  }
  return data;
}

function formatDate(value) {
  if (!value) return "";
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function AdminTable() {
  const [table, setTable] = useState({ standings: [], teams: [], matches: [] });
  const [teamName, setTeamName] = useState("");
  const [teamLogoFile, setTeamLogoFile] = useState(null);
  const [matchForm, setMatchForm] = useState(emptyMatch());
  const [editingMatchId, setEditingMatchId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [teamError, setTeamError] = useState("");
  const [pageError, setPageError] = useState("");

  async function loadTable(showLoading = false) {
    if (showLoading) setLoading(true);
    try {
      const data = await requestTable();
      setTable({ standings: data.standings || [], teams: data.teams || [], matches: data.matches || [] });
      setPageError("");
    } catch (err) {
      setPageError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    loadTable(true);
  }, []);

  const otherTeams = table.teams.filter((team) => team.name.trim().toLowerCase() !== "starehe fc");

  function handleMatchChange(event) {
    const { name, value } = event.target;
    setMatchForm((current) => ({ ...current, [name]: value }));
    setError("");
  }

  function resetMatchForm() {
    setMatchForm(emptyMatch());
    setEditingMatchId(null);
    setError("");
  }

  async function addTeam(event) {
    event.preventDefault();
    const name = teamName.trim();
    if (!name) return;
    setSaving(true);
    setTeamError("");
    setPageError("");
    try {
      let logo_url = null;
      if (teamLogoFile) {
        const body = new FormData();
        body.append("image", teamLogoFile);
        const response = await fetch(TEAM_UPLOAD_URL, { method: "POST", body });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "The badge upload failed.");
        logo_url = data.imageUrl;
      }
      await requestTable("/teams", { method: "POST", body: JSON.stringify({ name, logo_url }) });
      setTeamName("");
      setTeamLogoFile(null);
      const logoInput = document.getElementById("league-team-logo");
      if (logoInput) logoInput.value = "";
      setTeamError("");
      await loadTable();
    } catch (err) {
      setTeamError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeTeamBadge(team, file) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setPageError("Choose a small badge image under 1 MB.");
      return;
    }
    setSaving(true);
    setPageError("");
    try {
      const body = new FormData();
      body.append("image", file);
      const response = await fetch(TEAM_UPLOAD_URL, { method: "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "The badge upload failed.");
      await requestTable(`/teams/${team.id}`, {
        method: "PUT",
        body: JSON.stringify({ logo_url: data.imageUrl }),
      });
      await loadTable();
    } catch (err) {
      setPageError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTeam(team) {
    if (!window.confirm(`Remove ${team.name} from the league teams?`)) return;
    setPageError("");
    try {
      await requestTable(`/teams/${team.id}`, { method: "DELETE" });
      await loadTable();
    } catch (err) {
      setPageError(err.message);
    }
  }

  function editMatch(match) {
    setEditingMatchId(match.id);
    setMatchForm({
      home_team_id: String(match.home_team_id),
      away_team_id: String(match.away_team_id),
      match_date: String(match.match_date).slice(0, 10),
      home_score: String(match.home_score),
      away_score: String(match.away_score),
    });
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveMatch(event) {
    event.preventDefault();
    if (matchForm.home_score === "" || matchForm.away_score === "") {
      setError("Enter both teams’ scores.");
      return;
    }
    const payload = {
      ...matchForm,
      home_score: Number(matchForm.home_score),
      away_score: Number(matchForm.away_score),
    };
    setSaving(true);
    setError("");
    setPageError("");
    try {
      await requestTable(editingMatchId === null ? "/matches" : `/matches/${editingMatchId}`, {
        method: editingMatchId === null ? "POST" : "PUT",
        body: JSON.stringify(payload),
      });
      resetMatchForm();
      await loadTable();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMatch(match) {
    if (!window.confirm(`Delete ${match.home_team} vs ${match.away_team}?`)) return;
    setPageError("");
    try {
      await requestTable(`/matches/${match.id}`, { method: "DELETE" });
      if (editingMatchId === match.id) resetMatchForm();
      await loadTable();
    } catch (err) {
      setPageError(err.message);
    }
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <p className="admin-eyebrow">LEAGUE MANAGEMENT</p>
          <h1>League Table</h1>
          <p>Standings update from Starehe’s league results and the other clubs’ results recorded here.</p>
        </div>
      </div>

      {pageError && <p className="admin-form-error" role="alert">{pageError}</p>}

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div><p className="admin-eyebrow">LEAGUE TEAMS</p><h2>Add a team</h2></div>
          <span className="admin-count">{table.teams.length} teams</span>
        </div>
        <form onSubmit={addTeam}>
          <div className="admin-form-grid">
          <div className="admin-form-group">
              <label htmlFor="league-team-name">Team name</label>
              <input id="league-team-name" value={teamName} onChange={(event) => { setTeamName(event.target.value); setTeamError(""); }} maxLength={120} placeholder="e.g. Karatina FC" required />
            </div>
            <div className="admin-form-group">
              <label htmlFor="league-team-logo">Team badge (optional)</label>
              <input id="league-team-logo" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => {
                const file = event.target.files?.[0] || null;
                if (file && file.size > 1024 * 1024) {
                  setTeamError("Choose a small badge image under 1 MB.");
                  event.target.value = "";
                  setTeamLogoFile(null);
                  return;
                }
                setTeamLogoFile(file);
                setTeamError("");
              }} />
              <small>Choose the small club icon (PNG, JPG, or WebP; 1 MB max). A default badge is used if you leave this blank.</small>
            </div>
          </div>
          {teamError && <p className="admin-form-error" role="alert">{teamError}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button" disabled={saving}>{saving ? "Saving..." : "Add Team"}</button>
          </div>
        </form>
        {table.teams.length > 0 && (
          <div className="admin-fixture-list">
            {table.teams.map((team) => (
              <div className="admin-fixture-card" key={team.id}>
                <div className="admin-team-name"><ClubBadge src={team.logo_url} name={team.name} size="small" /><strong>{team.name}</strong></div>
                <label className="admin-edit-button admin-team-badge-button">
                  {team.logo_url || team.name.trim().toLowerCase() === "starehe fc" ? "Change badge" : "Add badge"}
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={saving} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) changeTeamBadge(team, file);
                    event.target.value = "";
                  }} />
                </label>
                {team.name.trim().toLowerCase() !== "starehe fc" && (
                  <button type="button" className="admin-delete-button" onClick={() => deleteTeam(team)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="admin-form-card">
        <div className="admin-form-header">
          <div><p className="admin-eyebrow">OTHER LEAGUE RESULTS</p><h2>{editingMatchId === null ? "Record a match" : "Edit match result"}</h2></div>
          {editingMatchId !== null && <button type="button" className="admin-secondary-button" onClick={resetMatchForm}>Cancel Edit</button>}
        </div>
        <p>Enter matches between other teams here. Record Starehe FC matches under Results.</p>
        <form onSubmit={saveMatch}>
          <div className="admin-form-grid">
            <div className="admin-form-group">
              <label htmlFor="league-home-team">Home team</label>
              <select id="league-home-team" name="home_team_id" value={matchForm.home_team_id} onChange={handleMatchChange} required>
                <option value="">Choose a team</option>
                {otherTeams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label htmlFor="league-away-team">Away team</label>
              <select id="league-away-team" name="away_team_id" value={matchForm.away_team_id} onChange={handleMatchChange} required>
                <option value="">Choose a team</option>
                {otherTeams.map((team) => <option value={team.id} key={team.id}>{team.name}</option>)}
              </select>
            </div>
            <div className="admin-form-group">
              <label htmlFor="league-match-date">Match date</label>
              <input id="league-match-date" type="date" name="match_date" value={matchForm.match_date} onChange={handleMatchChange} required />
            </div>
            <div className="admin-form-group">
              <label htmlFor="league-home-score">Home score</label>
              <input id="league-home-score" type="number" min="0" max="32767" step="1" name="home_score" value={matchForm.home_score} onChange={handleMatchChange} required />
            </div>
            <div className="admin-form-group">
              <label htmlFor="league-away-score">Away score</label>
              <input id="league-away-score" type="number" min="0" max="32767" step="1" name="away_score" value={matchForm.away_score} onChange={handleMatchChange} required />
            </div>
          </div>
          {error && <p className="admin-form-error" role="alert">{error}</p>}
          <div className="admin-form-actions">
            <button type="submit" className="admin-primary-button" disabled={saving || otherTeams.length < 2}>
              {saving ? "Saving..." : editingMatchId === null ? "Record Match" : "Save Changes"}
            </button>
          </div>
          {otherTeams.length < 2 && <p className="admin-count">Add at least two other teams to record their match.</p>}
        </form>
      </section>

      <section className="admin-form-card">
        <div className="admin-list-header">
          <div><p className="admin-eyebrow">CURRENT STANDINGS</p><h2>League Table</h2></div>
          <span className="admin-count">{table.standings.length} teams</span>
        </div>
        {loading ? (
          <div className="admin-empty-state"><strong>Loading league table...</strong></div>
        ) : table.standings.length === 0 ? (
          <div className="admin-empty-state"><strong>No teams yet.</strong><p>Add teams to start the table.</p></div>
        ) : (
          <div className="table-wrapper">
            <table className="league-table">
              <thead><tr><th>POS</th><th>TEAM</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th></tr></thead>
              <tbody>
                {table.standings.map((team, index) => (
                  <tr key={team.team} className={team.team.toLowerCase() === "starehe fc" ? "current-team" : ""}>
                    <td className="position">{index + 1}</td><td className="table-team"><span className="table-team-label"><ClubBadge src={team.logo_url} name={team.team} size="small" />{team.team}</span></td>
                    <td>{team.played}</td><td>{team.won}</td><td>{team.drawn}</td><td>{team.lost}</td>
                    <td>{team.goals_for}</td><td>{team.goals_against}</td>
                    <td>{team.goal_difference > 0 ? `+${team.goal_difference}` : team.goal_difference}</td>
                    <td className="points">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-form-card">
        <div className="admin-list-header">
          <div><p className="admin-eyebrow">MATCH RECORDS</p><h2>Other teams’ results</h2></div>
          <span className="admin-count">{table.matches.length} matches</span>
        </div>
        {table.matches.length === 0 ? (
          <div className="admin-empty-state"><strong>No other league results recorded yet.</strong><p>Use the form above when you have a match score.</p></div>
        ) : (
          <div className="admin-fixture-list">
            {table.matches.map((match) => (
              <article className="admin-fixture-card" key={match.id}>
                <div className="admin-fixture-date"><span>{formatDate(match.match_date)}</span></div>
                <div className="admin-result-match">
                  <div className="admin-result-scoreline"><span>{match.home_team}</span><strong>{match.home_score} - {match.away_score}</strong><span>{match.away_team}</span></div>
                </div>
                <div className="admin-fixture-actions">
                  <button type="button" className="admin-edit-button" onClick={() => editMatch(match)}>Edit</button>
                  <button type="button" className="admin-delete-button" onClick={() => deleteMatch(match)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default AdminTable;
