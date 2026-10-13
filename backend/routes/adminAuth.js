const express = require("express");
const crypto = require("crypto");

const router = express.Router();
const sessions = new Map();
const loginAttempts = new Map();

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function getBearerToken(req) {
  const authorization = req.get("authorization") || "";
  const match = authorization.match(/^Bearer (.+)$/i);
  return match ? match[1] : null;
}

function removeExpiredSessions() {
  const now = Date.now();

  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }
}

function requireAdminSession(req, res, next) {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      error: "Admin sign-in is not configured on the backend.",
    });
  }

  removeExpiredSessions();

  const token = getBearerToken(req);
  const expiresAt = token ? sessions.get(token) : null;

  if (!expiresAt || expiresAt <= Date.now()) {
    return res.status(401).json({
      error: "Please sign in to make admin changes.",
    });
  }

  next();
}

function requireAdminForWrites(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  return requireAdminSession(req, res, next);
}

function isCorrectPassword(providedPassword, configuredPassword) {
  const provided = Buffer.from(providedPassword);
  const configured = Buffer.from(configuredPassword);

  return (
    provided.length === configured.length &&
    crypto.timingSafeEqual(provided, configured)
  );
}

router.post("/login", (req, res) => {
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({
      error: "Admin sign-in is not configured on the backend.",
    });
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();
  let attempts = loginAttempts.get(ip);

  if (!attempts || now - attempts.startedAt > ATTEMPT_WINDOW_MS) {
    attempts = { startedAt: now, count: 0 };
    loginAttempts.set(ip, attempts);
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return res.status(429).json({
      error: "Too many sign-in attempts. Please wait 15 minutes and try again.",
    });
  }

  const password =
    typeof req.body?.password === "string" ? req.body.password : "";

  if (!isCorrectPassword(password, process.env.ADMIN_PASSWORD)) {
    attempts.count += 1;
    return res.status(401).json({ error: "The password is incorrect." });
  }

  loginAttempts.delete(ip);
  removeExpiredSessions();

  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, now + SESSION_DURATION_MS);

  res.json({
    token,
    expiresIn: SESSION_DURATION_MS,
  });
});

router.get("/session", requireAdminSession, (req, res) => {
  res.json({ authenticated: true });
});

module.exports = {
  router,
  requireAdminSession,
  requireAdminForWrites,
};