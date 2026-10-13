const express = require("express");
const pool = require("../db");

const router = express.Router();
const MAX_SCORE = 32767;

function validId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function validateMatch(body) {
  const errors = [];
  if (!validId(String(body.home_team_id ?? ""))) errors.push("Choose a valid home team");
  if (!validId(String(body.away_team_id ?? ""))) errors.push("Choose a valid away team");
  if (String(body.home_team_id) === String(body.away_team_id)) errors.push("The home and away teams must be different");
  if (!validDate(body.match_date)) errors.push("match_date must be a valid date in YYYY-MM-DD format");
  for (const field of ["home_score", "away_score"]) {
    if (!Number.isInteger(body[field]) || body[field] < 0 || body[field] > MAX_SCORE) {
      errors.push(`${field} must be a whole number from 0 to ${MAX_SCORE}`);
    }
  }
  return errors;
}

async function getStandings() {
  const [teamsResult, matchesResult, stareheResults] = await Promise.all([
    pool.query("SELECT id, name FROM league_teams ORDER BY name"),
    pool.query(
      "SELECT m.id, m.home_team_id, m.away_team_id, home.name AS home_team, away.name AS away_team, " +
      "m.match_date, m.home_score, m.away_score FROM league_matches m " +
      "JOIN league_teams home ON home.id = m.home_team_id " +
      "JOIN league_teams away ON away.id = m.away_team_id ORDER BY m.match_date DESC, m.id DESC",
    ),
    pool.query(
      "SELECT opponent, match_date, home_score, away_score, is_home FROM results " +
      "WHERE competition = 'League Match' ORDER BY match_date DESC, id DESC",
    ),
  ]);

  const teamNames = new Map(teamsResult.rows.map((team) => [team.name.trim().toLowerCase(), team.name]));
  const allMatches = matchesResult.rows.map((match) => ({
    home: match.home_team,
    away: match.away_team,
    home_score: match.home_score,
    away_score: match.away_score,
  }));

  for (const result of stareheResults.rows) {
    const home = result.is_home ? "Starehe FC" : result.opponent;
    const away = result.is_home ? result.opponent : "Starehe FC";
    teamNames.set(home.trim().toLowerCase(), teamNames.get(home.trim().toLowerCase()) || home);
    teamNames.set(away.trim().toLowerCase(), teamNames.get(away.trim().toLowerCase()) || away);
    allMatches.push({ home, away, home_score: result.home_score, away_score: result.away_score });
  }

  for (const match of matchesResult.rows) {
    teamNames.set(match.home_team.trim().toLowerCase(), match.home_team);
    teamNames.set(match.away_team.trim().toLowerCase(), match.away_team);
  }

  const stats = new Map();
  for (const [key, name] of teamNames) {
    stats.set(key, {
      team: name,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goals_for: 0,
      goals_against: 0,
      goal_difference: 0,
      points: 0,
    });
  }

  for (const match of allMatches) {
    const homeKey = match.home.trim().toLowerCase();
    const awayKey = match.away.trim().toLowerCase();
    const home = stats.get(homeKey);
    const away = stats.get(awayKey);
    if (!home || !away) continue;

    home.played += 1;
    away.played += 1;
    home.goals_for += match.home_score;
    home.goals_against += match.away_score;
    away.goals_for += match.away_score;
    away.goals_against += match.home_score;

    if (match.home_score > match.away_score) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (match.home_score < match.away_score) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  const standings = [...stats.values()].map((team) => ({
    ...team,
    goal_difference: team.goals_for - team.goals_against,
  })).sort((a, b) =>
    b.points - a.points ||
    b.goal_difference - a.goal_difference ||
    b.goals_for - a.goals_for ||
    a.team.localeCompare(b.team)
  );

  return { standings, teams: teamsResult.rows, matches: matchesResult.rows };
}

router.get("/", async (req, res, next) => {
  try {
    res.json(await getStandings());
  } catch (error) { next(error); }
});

router.get("/standings", async (req, res, next) => {
  try {
    const data = await getStandings();
    res.json(data.standings);
  } catch (error) { next(error); }
});

router.post("/teams", async (req, res, next) => {
  if (typeof req.body?.name !== "string" || !req.body.name.trim() || req.body.name.trim().length > 120) {
    return res.status(400).json({ error: "Team name is required and must be 120 characters or fewer" });
  }
  try {
    const { rows } = await pool.query("INSERT INTO league_teams (name) VALUES ($1) RETURNING id, name", [req.body.name.trim()]);
    res.status(201).json(rows[0]);
  } catch (error) {
    if (error.code === "23505") return res.status(409).json({ error: "That team is already on the league table" });
    next(error);
  }
});

router.delete("/teams/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query(
      "DELETE FROM league_teams team WHERE team.id = $1 " +
      "AND LOWER(team.name) <> 'starehe fc' " +
      "AND NOT EXISTS (SELECT 1 FROM league_matches lm WHERE lm.home_team_id = team.id OR lm.away_team_id = team.id) " +
      "AND NOT EXISTS (SELECT 1 FROM results result WHERE LOWER(result.opponent) = LOWER(team.name)) " +
      "RETURNING id",
      [req.params.id],
    );
    if (!rows.length) {
      const { rows: existing } = await pool.query("SELECT id FROM league_teams WHERE id = $1", [req.params.id]);
      if (!existing.length) return res.status(404).json({ error: "Team not found" });
      return res.status(409).json({ error: "Starehe FC or a team with recorded results cannot be removed" });
    }
    res.status(204).end();
  } catch (error) {
    if (error.code === "23503") return res.status(409).json({ error: "Delete this team's recorded matches first" });
    next(error);
  }
});

router.post("/matches", async (req, res, next) => {
  const errors = validateMatch(req.body || {});
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  try {
    const teamIds = [req.body.home_team_id, req.body.away_team_id];
    const teamResult = await pool.query("SELECT id, name FROM league_teams WHERE id = ANY($1::bigint[])", [teamIds]);
    if (teamResult.rows.length !== 2) return res.status(400).json({ error: "Choose two teams from the league table" });
    if (teamResult.rows.some((team) => team.name.trim().toLowerCase() === "starehe fc")) {
      return res.status(400).json({ error: "Enter Starehe FC matches in the Results admin page" });
    }
    const { rows } = await pool.query(
      "INSERT INTO league_matches (home_team_id, away_team_id, match_date, home_score, away_score) " +
      "VALUES ($1, $2, $3, $4, $5) RETURNING id, home_team_id, away_team_id, match_date, home_score, away_score",
      [req.body.home_team_id, req.body.away_team_id, req.body.match_date, req.body.home_score, req.body.away_score],
    );
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put("/matches/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  const errors = validateMatch(req.body || {});
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  try {
    const teamIds = [req.body.home_team_id, req.body.away_team_id];
    const teamResult = await pool.query("SELECT id, name FROM league_teams WHERE id = ANY($1::bigint[])", [teamIds]);
    if (teamResult.rows.length !== 2) return res.status(400).json({ error: "Choose two teams from the league table" });
    if (teamResult.rows.some((team) => team.name.trim().toLowerCase() === "starehe fc")) {
      return res.status(400).json({ error: "Enter Starehe FC matches in the Results admin page" });
    }
    const { rows } = await pool.query(
      "UPDATE league_matches SET home_team_id = $1, away_team_id = $2, match_date = $3, " +
      "home_score = $4, away_score = $5, updated_at = NOW() WHERE id = $6 " +
      "RETURNING id, home_team_id, away_team_id, match_date, home_score, away_score",
      [req.body.home_team_id, req.body.away_team_id, req.body.match_date, req.body.home_score, req.body.away_score, req.params.id],
    );
    if (!rows.length) return res.status(404).json({ error: "League match not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete("/matches/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rowCount } = await pool.query("DELETE FROM league_matches WHERE id = $1", [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: "League match not found" });
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
