const express = require("express");
const pool = require("../db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT player.id AS player_id, player.full_name, player.shirt_number, player.position, scorer.goals, scorer.updated_at " +
      "FROM top_scorers scorer JOIN players player ON player.id = scorer.player_id " +
      "WHERE player.is_active = TRUE ORDER BY scorer.goals DESC, player.full_name ASC",
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.put("/:playerId", async (req, res, next) => {
  if (!/^\d+$/.test(req.params.playerId) || Number(req.params.playerId) < 1) {
    return res.status(400).json({ error: "Player ID must be a positive integer" });
  }
  const goals = Number(req.body?.goals);
  if (!Number.isInteger(goals) || goals < 0 || goals > 1000) {
    return res.status(400).json({ error: "Goals must be a whole number from 0 to 1000" });
  }
  try {
    const result = await pool.query(
      "INSERT INTO top_scorers (player_id, goals) VALUES ($1, $2) " +
      "ON CONFLICT (player_id) DO UPDATE SET goals = EXCLUDED.goals, updated_at = NOW() " +
      "RETURNING player_id, goals, updated_at",
      [req.params.playerId, goals],
    );
    res.json(result.rows[0]);
  } catch (error) {
    if (error.code === "23503") return res.status(404).json({ error: "Player not found" });
    next(error);
  }
});

router.delete("/:playerId", async (req, res, next) => {
  if (!/^\d+$/.test(req.params.playerId) || Number(req.params.playerId) < 1) {
    return res.status(400).json({ error: "Player ID must be a positive integer" });
  }
  try {
    const { rowCount } = await pool.query("DELETE FROM top_scorers WHERE player_id = $1", [req.params.playerId]);
    if (!rowCount) return res.status(404).json({ error: "Top scorer entry not found" });
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
