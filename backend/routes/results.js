const express = require("express");
const pool = require("../db");

const router = express.Router();
const MAX_SCORE = 32767;
const RESULT_STATUSES = ["Normal", "Cancelled", "Postponed", "Home walkover", "Away walkover", "Home win penalties", "Away win penalties", "Abandoned", "Void"];
const SCORE_REQUIRED_STATUSES = ["Normal", "Home win penalties", "Away win penalties"];

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateResult(body) {
  const errors = [];

  if (!/^\d+$/.test(String(body.opponent_team_id ?? "")) || Number(body.opponent_team_id) < 1) {
    errors.push("Choose a registered opponent team");
  }

  if (!validDate(body.match_date)) {
    errors.push("match_date must be a valid date in YYYY-MM-DD format");
  }

  const status = body.status ?? "Normal";
  if (!RESULT_STATUSES.includes(status)) errors.push("status must be a supported match status");

  for (const field of ["starehe_score", "opponent_score"]) {
    const score = body[field] ?? (SCORE_REQUIRED_STATUSES.includes(status) ? undefined : 0);
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
      errors.push(field + " must be a whole number from 0 to " + MAX_SCORE);
    }
  }

  if (typeof body.is_home !== "boolean") {
    errors.push("is_home must be a boolean");
  }

  if (body.venue !== null && body.venue !== undefined && typeof body.venue !== "string") {
    errors.push("venue must be a string or null");
  } else if (typeof body.venue === "string" && body.venue.length > 200) {
    errors.push("venue must be 200 characters or fewer");
  }

  if (body.competition !== null && body.competition !== undefined && typeof body.competition !== "string") {
    errors.push("competition must be a string or null");
  } else if (typeof body.competition === "string" && body.competition.length > 120) {
    errors.push("competition must be 120 characters or fewer");
  }

  return errors;
}

function scoreColumns(body) {
  const stareheScore = body.starehe_score ?? 0;
  const opponentScore = body.opponent_score ?? 0;
  return body.is_home
    ? [stareheScore, opponentScore]
    : [opponentScore, stareheScore];
}

function serializeResult(row) {
  return {
    id: row.id,
    fixture_id: row.fixture_id,
    opponent_team_id: row.opponent_team_id,
    opponent: row.opponent_team_name || row.opponent,
    match_date: row.match_date,
    starehe_score: row.is_home ? row.home_score : row.away_score,
    opponent_score: row.is_home ? row.away_score : row.home_score,
    status: row.status || "Normal",
    venue: row.venue,
    competition: row.competition,
    is_home: row.is_home,
    opponent_logo_url: row.opponent_logo_url || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function handleDatabaseError(error, res, next) {
  if (error.code === "23505") {
    return res.status(409).json({ error: "This fixture already has a result" });
  }
  if (["22007", "22008", "22P02", "23514", "23502", "23503"].includes(error.code)) {
    return res.status(400).json({ error: "Invalid result data" });
  }
  return next(error);
}

function validId(id) {
  return /^\d+$/.test(id);
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT results.*, league_teams.name AS opponent_team_name, league_teams.logo_url AS opponent_logo_url FROM results " +
      "JOIN league_teams ON league_teams.id = results.opponent_team_id " +
      "ORDER BY results.match_date DESC, results.id DESC"
    );
    res.json(rows.map(serializeResult));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }
  try {
    const { rows } = await pool.query(
      "SELECT results.*, league_teams.name AS opponent_team_name, league_teams.logo_url AS opponent_logo_url FROM results " +
      "JOIN league_teams ON league_teams.id = results.opponent_team_id WHERE results.id = $1",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Result not found" });
    res.json(serializeResult(rows[0]));
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }

  const errors = validateResult(req.body);
  if (errors.length) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const [homeScore, awayScore] = scoreColumns(req.body);
  try {
    const { rows: teamRows } = await pool.query(
      "SELECT id, name, logo_url FROM league_teams WHERE id = $1",
      [req.body.opponent_team_id],
    );
    if (!teamRows.length) return res.status(400).json({ error: "Choose a registered opponent team" });
    const { rows } = await pool.query(
      "INSERT INTO results " +
        "(opponent_team_id, opponent, match_date, home_score, away_score, venue, competition, is_home, status) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *",
      [
        teamRows[0].id,
        teamRows[0].name,
        req.body.match_date,
        homeScore,
        awayScore,
        req.body.venue?.trim() || null,
        req.body.competition?.trim() || null,
        req.body.is_home,
        req.body.status || "Normal",
      ],
    );
    res.status(201).json(serializeResult({ ...rows[0], opponent_logo_url: teamRows[0].logo_url }));
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

router.put("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }

  const errors = validateResult(req.body);
  if (errors.length) {
    return res.status(400).json({ error: "Validation failed", details: errors });
  }

  const [homeScore, awayScore] = scoreColumns(req.body);
  try {
    const { rows: teamRows } = await pool.query(
      "SELECT id, name, logo_url FROM league_teams WHERE id = $1",
      [req.body.opponent_team_id],
    );
    if (!teamRows.length) return res.status(400).json({ error: "Choose a registered opponent team" });
    const { rows } = await pool.query(
      "UPDATE results SET opponent_team_id = $1, opponent = $2, match_date = $3, home_score = $4, " +
        "away_score = $5, venue = $6, competition = $7, is_home = $8, status = $9, " +
        "updated_at = NOW() WHERE id = $10 RETURNING *",
      [
        teamRows[0].id,
        teamRows[0].name,
        req.body.match_date,
        homeScore,
        awayScore,
        req.body.venue?.trim() || null,
        req.body.competition?.trim() || null,
        req.body.is_home,
        req.body.status || "Normal",
        req.params.id,
      ],
    );
    if (!rows.length) return res.status(404).json({ error: "Result not found" });
    res.json(serializeResult({ ...rows[0], opponent_logo_url: teamRows[0].logo_url }));
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) {
    return res.status(400).json({ error: "id must be a positive integer" });
  }
  try {
    const { rowCount } = await pool.query("DELETE FROM results WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Result not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;

