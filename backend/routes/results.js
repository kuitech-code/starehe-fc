const express = require("express");
const pool = require("../db");

const router = express.Router();
const MAX_SCORE = 32767;

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validateResult(body) {
  const errors = [];

  if (typeof body.opponent !== "string" || !body.opponent.trim()) {
    errors.push("opponent is required and must be a non-empty string");
  } else if (body.opponent.trim().length > 120) {
    errors.push("opponent must be 120 characters or fewer");
  }

  if (!validDate(body.match_date)) {
    errors.push("match_date must be a valid date in YYYY-MM-DD format");
  }

  for (const field of ["starehe_score", "opponent_score"]) {
    if (!Number.isInteger(body[field]) || body[field] < 0 || body[field] > MAX_SCORE) {
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
  return body.is_home
    ? [body.starehe_score, body.opponent_score]
    : [body.opponent_score, body.starehe_score];
}

function serializeResult(row) {
  return {
    id: row.id,
    fixture_id: row.fixture_id,
    opponent: row.opponent,
    match_date: row.match_date,
    starehe_score: row.is_home ? row.home_score : row.away_score,
    opponent_score: row.is_home ? row.away_score : row.home_score,
    venue: row.venue,
    competition: row.competition,
    is_home: row.is_home,
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
      "SELECT * FROM results ORDER BY match_date DESC, id DESC"
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
    const { rows } = await pool.query("SELECT * FROM results WHERE id = $1", [req.params.id]);
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
    const { rows } = await pool.query(
      "INSERT INTO results " +
        "(opponent, match_date, home_score, away_score, venue, competition, is_home) " +
        "VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [
        req.body.opponent.trim(),
        req.body.match_date,
        homeScore,
        awayScore,
        req.body.venue?.trim() || null,
        req.body.competition?.trim() || null,
        req.body.is_home,
      ],
    );
    res.status(201).json(serializeResult(rows[0]));
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
    const { rows } = await pool.query(
      "UPDATE results SET opponent = $1, match_date = $2, home_score = $3, " +
        "away_score = $4, venue = $5, competition = $6, is_home = $7, " +
        "updated_at = NOW() WHERE id = $8 RETURNING *",
      [
        req.body.opponent.trim(),
        req.body.match_date,
        homeScore,
        awayScore,
        req.body.venue?.trim() || null,
        req.body.competition?.trim() || null,
        req.body.is_home,
        req.params.id,
      ],
    );
    if (!rows.length) return res.status(404).json({ error: "Result not found" });
    res.json(serializeResult(rows[0]));
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

