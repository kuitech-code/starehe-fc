const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedFields = [
  "opponent_team_id",
  "match_date",
  "kickoff_time",
  "venue",
  "competition",
  "is_home",
  "status",
];
const allowedStatuses = new Set([
  "Scheduled",
  "Postponed",
  "Cancelled",
  "Completed",
]);

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value;
}

function validTime(value) {
  if (value === null) return true;
  if (typeof value !== "string" || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return false;
  const [hour, minute, second = "00"] = value.split(":").map(Number);
  return hour < 24 && minute < 60 && second < 60;
}

function validateFixture(body, { partial = false } = {}) {
  const errors = [];

  if (!/^\d+$/.test(String(body.opponent_team_id ?? "")) || Number(body.opponent_team_id) < 1) {
    errors.push("Choose a registered opponent team");
  }

  if (!partial || Object.hasOwn(body, "match_date")) {
    if (!validDate(body.match_date)) errors.push("match_date must be a valid date in YYYY-MM-DD format");
  }

  if (Object.hasOwn(body, "kickoff_time") && body.kickoff_time !== "" && !validTime(body.kickoff_time)) {
    errors.push("kickoff_time must be a valid time in HH:MM format or null");
  }

  if (Object.hasOwn(body, "venue") && body.venue !== null && typeof body.venue !== "string") {
    errors.push("venue must be a string or null");
  } else if (typeof body.venue === "string" && body.venue.length > 200) {
    errors.push("venue must be 200 characters or fewer");
  }

  if (Object.hasOwn(body, "competition") && body.competition !== null && typeof body.competition !== "string") {
    errors.push("competition must be a string or null");
  } else if (typeof body.competition === "string" && body.competition.length > 120) {
    errors.push("competition must be 120 characters or fewer");
  }

  if (Object.hasOwn(body, "is_home") && typeof body.is_home !== "boolean") {
    errors.push("is_home must be a boolean");
  }

  if (Object.hasOwn(body, "status") && !allowedStatuses.has(body.status)) {
    errors.push("status must be Scheduled, Postponed, Cancelled, or Completed");
  }

  return errors;
}

function fixtureValues(body) {
  const values = {};
  for (const field of allowedFields) {
    if (!Object.hasOwn(body, field)) continue;
    const value = body[field];
    if (field === "kickoff_time" && value === "") values[field] = null;
    else if ((field === "venue" || field === "competition") && value === "") values[field] = null;
    else values[field] = value;
  }
  return values;
}

function handleDatabaseError(error, res, next) {
  if (["22007", "22008", "22P02", "23514", "23502", "23503"].includes(error.code)) {
    return res.status(400).json({ error: "Invalid fixture data" });
  }
  return next(error);
}

function validId(id) {
  return /^\d+$/.test(id);
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT fixtures.*, league_teams.name AS opponent_team_name, league_teams.logo_url AS opponent_logo_url FROM fixtures " +
      "JOIN league_teams ON league_teams.id = fixtures.opponent_team_id " +
      "ORDER BY fixtures.match_date, fixtures.kickoff_time NULLS LAST, fixtures.id"
    );
    res.json(rows.map((row) => ({ ...row, opponent: row.opponent_team_name })));
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query(
      "SELECT fixtures.*, league_teams.name AS opponent_team_name, league_teams.logo_url AS opponent_logo_url FROM fixtures " +
      "JOIN league_teams ON league_teams.id = fixtures.opponent_team_id WHERE fixtures.id = $1",
      [req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Fixture not found" });
    res.json({ ...rows[0], opponent: rows[0].opponent_team_name });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  const errors = validateFixture(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

  try {
    const { rows: teamRows } = await pool.query(
      "SELECT id, name, logo_url FROM league_teams WHERE id = $1",
      [req.body.opponent_team_id],
    );
    if (!teamRows.length) return res.status(400).json({ error: "Choose a registered opponent team" });
    const values = fixtureValues(req.body);
    values.opponent = teamRows[0].name;
    const columns = Object.keys(values);
    const { rows } = await pool.query(
      `INSERT INTO fixtures (${columns.join(", ")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(values),
    );
    res.status(201).json({ ...rows[0], opponent: teamRows[0].name, opponent_logo_url: teamRows[0].logo_url });
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

router.put("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ error: "Request body must be a JSON object" });
  }
  const errors = validateFixture(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });

  try {
    const { rows: teamRows } = await pool.query(
      "SELECT id, name, logo_url FROM league_teams WHERE id = $1",
      [req.body.opponent_team_id],
    );
    if (!teamRows.length) return res.status(400).json({ error: "Choose a registered opponent team" });
    const values = fixtureValues(req.body);
    values.opponent = teamRows[0].name;
    const columns = Object.keys(values);
    if (!columns.length) return res.status(400).json({ error: "Provide at least one fixture field to update" });
    const assignments = columns.map((field, i) => `${field} = $${i + 1}`);
    assignments.push("updated_at = NOW()");
    const { rows } = await pool.query(
      `UPDATE fixtures SET ${assignments.join(", ")} WHERE id = $${columns.length + 1} RETURNING *`,
      [...Object.values(values), req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Fixture not found" });
    res.json({ ...rows[0], opponent: teamRows[0].name, opponent_logo_url: teamRows[0].logo_url });
  } catch (error) {
    handleDatabaseError(error, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rowCount } = await pool.query("DELETE FROM fixtures WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Fixture not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
 
