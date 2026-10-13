const express = require("express");
const pool = require("../db");

const router = express.Router();
const positions = new Set(["Goalkeeper", "Defender", "Midfielder", "Forward"]);
const fields = ["full_name", "shirt_number", "position", "photo_url", "bio", "is_active"];

function validatePlayer(body, { partial = false } = {}) {
  const errors = [];
  if (!partial || Object.hasOwn(body, "full_name")) {
    if (typeof body.full_name !== "string" || !body.full_name.trim()) errors.push("full_name is required and must be a non-empty string");
    else if (body.full_name.trim().length > 120) errors.push("full_name must be 120 characters or fewer");
  }
  if (!partial || Object.hasOwn(body, "shirt_number")) {
    if (!Number.isInteger(body.shirt_number) || body.shirt_number < 1 || body.shirt_number > 99) errors.push("shirt_number must be an integer from 1 to 99");
  }
  if (!partial || Object.hasOwn(body, "position")) {
    if (!positions.has(body.position)) errors.push("position must be Goalkeeper, Defender, Midfielder, or Forward");
  }
  for (const field of ["photo_url", "bio"]) {
    if (Object.hasOwn(body, field) && body[field] !== null && typeof body[field] !== "string") errors.push(`${field} must be a string or null`);
  }
  if (Object.hasOwn(body, "is_active") && typeof body.is_active !== "boolean") errors.push("is_active must be a boolean");
  return errors;
}

function playerValues(body) {
  const values = {};
  for (const field of fields) {
    if (!Object.hasOwn(body, field)) continue;
    values[field] = field === "full_name" ? body[field].trim() : body[field];
  }
  return values;
}

function handleError(error, res, next) {
  if (error.code === "23505") return res.status(409).json({ error: "A player with that shirt_number already exists" });
  if (error.code === "22P02" || error.code === "23514" || error.code === "23502") return res.status(400).json({ error: "Invalid player data" });
  return next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM players ORDER BY shirt_number, id");
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query("SELECT * FROM players WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Player not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post("/", async (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Request body must be a JSON object" });
  const errors = validatePlayer(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  const values = playerValues(req.body);
  try {
    const { rows } = await pool.query(
      `INSERT INTO players (${Object.keys(values).join(", ")}) VALUES (${Object.keys(values).map((_, i) => `$${i + 1}`).join(", ")}) RETURNING *`,
      Object.values(values),
    );
    res.status(201).json(rows[0]);
  } catch (error) { handleError(error, res, next); }
});

router.put("/:id", async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Request body must be a JSON object" });
  const errors = validatePlayer(req.body, { partial: true });
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  const values = playerValues(req.body);
  if (!Object.keys(values).length) return res.status(400).json({ error: "Provide at least one player field to update" });
  const assignments = Object.keys(values).map((field, i) => `${field} = $${i + 1}`);
  assignments.push("updated_at = NOW()");
  try {
    const { rows } = await pool.query(`UPDATE players SET ${assignments.join(", ")} WHERE id = $${Object.keys(values).length + 1} RETURNING *`, [...Object.values(values), req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Player not found" });
    res.json(rows[0]);
  } catch (error) { handleError(error, res, next); }
});

router.delete("/:id", async (req, res, next) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rowCount } = await pool.query("DELETE FROM players WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "Player not found" });
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
