const express = require("express");
const crypto = require("crypto");
const { promisify } = require("util");
const pool = require("../db");

const router = express.Router();
const scrypt = promisify(crypto.scrypt);
const sessions = new Map();
const loginAttempts = new Map();

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const PASSWORD_BYTES = 64;

function isAdminEnabled() {
  return String(process.env.ADMIN_ENABLED).toLowerCase() === "true";
}

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
  if (!isAdminEnabled()) {
    return res.status(403).json({
      error: "Admin access is currently disabled.",
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

function passwordsMatch(providedPassword, configuredPassword) {
  const provided = Buffer.from(providedPassword, "utf8");
  const configured = Buffer.from(configuredPassword, "utf8");

  return (
    provided.length === configured.length &&
    crypto.timingSafeEqual(provided, configured)
  );
}

async function verifySavedPassword(password, credential) {
  if (
    !credential ||
    !/^[a-f0-9]+$/i.test(credential.password_salt) ||
    !/^[a-f0-9]+$/i.test(credential.password_hash)
  ) {
    return false;
  }

  const salt = Buffer.from(credential.password_salt, "hex");
  const savedHash = Buffer.from(credential.password_hash, "hex");

  if (savedHash.length !== PASSWORD_BYTES) return false;

  const enteredHash = await scrypt(password, salt, PASSWORD_BYTES, {
    maxmem: 64 * 1024 * 1024,
  });

  return crypto.timingSafeEqual(enteredHash, savedHash);
}

async function verifyAdminPassword(password) {
  const result = await pool.query(
    `SELECT password_salt, password_hash
     FROM admin_credentials
     WHERE id = 1`
  );

  const savedCredential = result.rows[0];

  if (savedCredential) {
    return verifySavedPassword(password, savedCredential);
  }

  const initialPassword = process.env.ADMIN_PASSWORD;
  return Boolean(
    initialPassword && passwordsMatch(password, initialPassword)
  );
}

router.post("/login", async (req, res) => {
  if (!isAdminEnabled()) {
    return res.status(403).json({
      error: "Admin access is currently disabled.",
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

  try {
    const isValid = await verifyAdminPassword(password);

    if (!isValid) {
      attempts.count += 1;
      return res.status(401).json({ error: "The password is incorrect." });
    }

    loginAttempts.delete(ip);
    removeExpiredSessions();

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, now + SESSION_DURATION_MS);

    return res.json({
      token,
      expiresIn: SESSION_DURATION_MS,
    });
  } catch (error) {
    console.error("Admin login failed:", error.message);
    return res.status(500).json({
      error: "Could not sign in right now. Please try again.",
    });
  }
});

router.get(
  "/password-change-status",
  requireAdminSession,
  (req, res) => {
    res.json({
      enabled:
        String(process.env.ADMIN_PASSWORD_CHANGE_ENABLED).toLowerCase() ===
        "true",
    });
  }
);

router.post("/password", requireAdminSession, async (req, res) => {
  if (String(process.env.ADMIN_PASSWORD_CHANGE_ENABLED).toLowerCase() !== "true") {
    return res.status(403).json({
      error: "Password changes are disabled until further notice.",
    });
  }

  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";
  const newPassword =
    typeof req.body?.newPassword === "string" ? req.body.newPassword : "";

  if (newPassword.length < 12 || newPassword.length > 128) {
    return res.status(400).json({
      error: "The new password must be 12 to 128 characters long.",
    });
  }

  try {
    const isCurrentPasswordValid =
      await verifyAdminPassword(currentPassword);

    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        error: "The current password is incorrect.",
      });
    }

    const salt = crypto.randomBytes(16);
    const hash = await scrypt(newPassword, salt, PASSWORD_BYTES, {
      maxmem: 64 * 1024 * 1024,
    });

    await pool.query(
      `INSERT INTO admin_credentials
         (id, password_salt, password_hash, updated_at)
       VALUES (1, $1, $2, NOW())
       ON CONFLICT (id)
       DO UPDATE SET
         password_salt = EXCLUDED.password_salt,
         password_hash = EXCLUDED.password_hash,
         updated_at = NOW()`,
      [salt.toString("hex"), hash.toString("hex")]
    );

    // Require a fresh sign-in after changing the password.
    sessions.clear();

    return res.json({
      message: "Password changed. Please sign in again with the new password.",
    });
  } catch (error) {
    console.error("Admin password change failed:", error.message);
    return res.status(500).json({
      error: "Could not change the password right now. Please try again.",
    });
  }
});

router.get("/profile", requireAdminSession, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT display_name, role
       FROM admin_profile
       WHERE id = 1`
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Admin profile not found." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not load admin profile:", error.message);
    return res.status(500).json({ error: "Could not load admin profile." });
  }
});

router.put("/profile", requireAdminSession, async (req, res) => {
  const displayName =
    typeof req.body?.display_name === "string"
      ? req.body.display_name.trim()
      : "";
  const role =
    typeof req.body?.role === "string" ? req.body.role.trim() : "";

  if (!displayName || displayName.length > 100) {
    return res.status(400).json({
      error: "Enter a name that is between 1 and 100 characters.",
    });
  }

  if (!role || role.length > 80) {
    return res.status(400).json({
      error: "Enter a role that is between 1 and 80 characters.",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE admin_profile
       SET display_name = $1, role = $2, updated_at = NOW()
       WHERE id = 1
       RETURNING display_name, role`,
      [displayName, role]
    );

    if (!result.rows[0]) {
      return res.status(404).json({ error: "Admin profile not found." });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error("Could not save admin profile:", error.message);
    return res.status(500).json({ error: "Could not save admin profile." });
  }
});

router.post("/logout", requireAdminSession, (req, res) => {
  const token = getBearerToken(req);
  if (token) sessions.delete(token);

  return res.json({ signedOut: true });
});

router.get("/session", requireAdminSession, (req, res) => {
  res.json({ authenticated: true });
});

module.exports = {
  router,
  requireAdminSession,
  requireAdminForWrites,
};