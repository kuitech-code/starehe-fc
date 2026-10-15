import { useEffect, useState } from "react";
import { fetchApiList } from "../api";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

function AdminTopScorers() {
  const [players, setPlayers] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [playerId, setPlayerId] = useState("");
  const [goals, setGoals] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const [playerRows, scorerRows] = await Promise.all([
        fetchApiList("/api/players", "players"),
        fetchApiList("/api/top-scorers", "top scorers"),
      ]);
      setPlayers(playerRows.filter((player) => player.is_active !== false));
      setScorers(scorerRows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const availablePlayers = players;

  async function saveScorer(event) {
    event.preventDefault();
    if (!playerId) {
      setError("Choose a player first.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API_ORIGIN}/api/top-scorers/${playerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goals: Number(goals) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not save scorer.");
      setPlayerId("");
      setGoals("1");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeScorer(id) {
    setError("");
    try {
      const response = await fetch(`${API_ORIGIN}/api/top-scorers/${id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not remove scorer.");
      setScorers((current) => current.filter((scorer) => String(scorer.player_id) !== String(id)));
    } catch (err) {
      setError(err.message);
    }
  }

  function editScorer(scorer) {
    setPlayerId(String(scorer.player_id));
    setGoals(String(scorer.goals));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header"><div><span className="admin-eyebrow">PLAYER STATISTICS</span><h1>Top Scorers</h1><p>Update each player's current league goal total.</p></div></div>
      {error && <p className="admin-form-error" role="alert">{error}</p>}
      <section className="admin-form-card">
        <div className="admin-form-header"><div><h2>Add or update a scorer</h2><p>Use the official current total for this season.</p></div></div>
        <form onSubmit={saveScorer} className="admin-scorer-form">
          <div className="admin-form-group"><label htmlFor="scorer-player">Player</label><select id="scorer-player" value={playerId} onChange={(event) => setPlayerId(event.target.value)} required><option value="">Choose a player</option>{availablePlayers.map((player) => <option key={player.id} value={player.id}>{player.full_name} (#{player.shirt_number})</option>)}</select></div>
          <div className="admin-form-group"><label htmlFor="scorer-goals">Goals</label><input id="scorer-goals" type="number" min="0" max="1000" step="1" value={goals} onChange={(event) => setGoals(event.target.value)} required /></div>
          <button className="admin-primary-button" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Scorer"}</button>
        </form>
      </section>
      <section className="admin-scorer-list">
        <div className="admin-list-header"><div><h2>Current Top Scorers</h2><span className="admin-count">{scorers.length} {scorers.length === 1 ? "player" : "players"}</span></div></div>
        {loading ? <div className="admin-empty-state"><strong>Loading scorers...</strong></div> : scorers.length === 0 ? <div className="admin-empty-state"><h3>No scorers listed yet</h3><p>Add players and their goal totals above.</p></div> : (
          <div className="admin-scorer-table-wrap"><table className="admin-scorer-table"><thead><tr><th>POS</th><th>PLAYER</th><th>GOALS</th><th>ACTIONS</th></tr></thead><tbody>{scorers.map((scorer, index) => <tr key={scorer.player_id}><td>{index + 1}</td><td>{scorer.full_name} <span>#{scorer.shirt_number}</span></td><td>{scorer.goals}</td><td><button type="button" className="admin-edit-button" onClick={() => editScorer(scorer)}>Edit</button><button type="button" className="admin-delete-button" onClick={() => removeScorer(scorer.player_id)}>Remove</button></td></tr>)}</tbody></table></div>
        )}
      </section>
    </div>
  );
}

export default AdminTopScorers;
