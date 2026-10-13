const express = require("express");
const pool = require("../db");

const router = express.Router();
const allowedFields = [
  "opponent",
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

  if (!partial || Object.hasOwn(body, "opponent")) {
    if (typeof body.opponent !== "string" || !body.opponent.trim()) {
      errors.push("opponent is required and must be a non-empty string");
    } else if (body.opponent.trim().length > 120) {
      errors.push("opponent must be 120 characters or fewer");
    }
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
    if (field === "opponent") values[field] = value.trim();
    else if (field === "kickoff_time" && value === "") values[field] = null;
    else if ((field === "venue" || field === "competition") && value === "") values[field] = null;
    else values[field] = value;
  }
  return values;
}

function handleDatabaseError(error, res, next) {
  if (["22007", "22008", "22P02", "23514", "23502"].includes(error.code)) {
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
      "SELECT * FROM fixtures ORDER BY match_date, kickoff_time NULLS LAST, id"
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query("SELECT * FROM fixtures WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Fixture not found" });
    res.json(rows[0]);
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

  const values = fixtureValues(req.body);
  const columns = Object.keys(values);
  try {
    const { rows } = await pool.query(
      `INSERT INTO fixtures (${columns.join(", ")}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(values),
    );
    res.status(201).json(rows[0]);
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

  const values = fixtureValues(req.body);
  const columns = Object.keys(values);
  if (!columns.length) return res.status(400).json({ error: "Provide at least one fixture field to update" });

  const assignments = columns.map((field, i) => `${field} = $${i + 1}`);
  assignments.push("updated_at = NOW()");
  try {
    const { rows } = await pool.query(
      `UPDATE fixtures SET ${assignments.join(", ")} WHERE id = $${columns.length + 1} RETURNING *`,
      [...Object.values(values), req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "Fixture not found" });
    res.json(rows[0]);
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
 
