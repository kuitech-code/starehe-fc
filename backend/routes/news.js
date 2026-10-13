const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const pool = require("../db");

const router = express.Router();
const categories = ["Club News", "Match Reports", "Team News", "Community", "Announcements"];
const statuses = ["Draft", "Published"];
const uploadDirectory = path.join(__dirname, "..", "uploads", "news");
const extensionByType = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, uploadDirectory),
    filename: (req, file, callback) => callback(null, `${crypto.randomUUID()}${extensionByType[file.mimetype] || ".img"}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 10, fieldSize: 64 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!extensionByType[file.mimetype]) {
      const error = new Error("Choose a JPG, PNG, WebP, or GIF image.");
      error.status = 400;
      return callback(error);
    }
    callback(null, true);
  },
});

function validId(id) {
  return /^\d+$/.test(id) && Number(id) > 0;
}

function makeSlug(title) {
  const base = title.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "article";
  return `${base}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function validateArticle(body) {
  const errors = [];
  if (typeof body.title !== "string" || !body.title.trim()) errors.push("title is required");
  else if (body.title.trim().length > 180) errors.push("title must be 180 characters or fewer");
  if (typeof body.category !== "string" || !categories.includes(body.category)) {
    errors.push(`category must be one of: ${categories.join(", ")}`);
  }
  if (typeof body.excerpt !== "string" || !body.excerpt.trim()) errors.push("excerpt is required");
  else if (body.excerpt.trim().length > 500) errors.push("excerpt must be 500 characters or fewer");
  if (typeof body.status !== "string" || !statuses.includes(body.status)) errors.push("status must be Draft or Published");
  if (body.image_url !== null && body.image_url !== undefined && typeof body.image_url !== "string") {
    errors.push("image_url must be a string or null");
  }
  return errors;
}

function removeUploadedFile(file) {
  if (file?.path) fs.unlink(file.path, () => {});
}

function removeStoredImage(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl.startsWith("/uploads/news/")) return;
  const filename = path.basename(imageUrl);
  if (filename !== imageUrl.slice("/uploads/news/".length)) return;
  fs.unlink(path.join(uploadDirectory, filename), () => {});
}

function handleDatabaseError(error, res, next) {
  if (error.code === "23505") return res.status(409).json({ error: "An article with this headline already exists" });
  if (["22P02", "23514", "23502"].includes(error.code)) return res.status(400).json({ error: "Invalid article data" });
  return next(error);
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await pool.query("SELECT * FROM news_articles ORDER BY updated_at DESC, id DESC");
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/published", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM news_articles WHERE status = 'Published' " +
        "ORDER BY published_at DESC NULLS LAST, updated_at DESC, id DESC",
    );
    res.json(rows);
  } catch (error) { next(error); }
});
router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query("SELECT * FROM news_articles WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Article not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post("/", upload.single("image"), async (req, res, next) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "Request body must be a form or JSON object" });
  }
  const errors = validateArticle(req.body);
  if (errors.length) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  const { title, category, excerpt, status } = req.body;
  const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : (req.body.image_url?.trim() || null);
  try {
    const { rows } = await pool.query(
      "INSERT INTO news_articles (title, slug, category, excerpt, image_url, status, published_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $7::text = 'Published' THEN NOW() ELSE NULL END) RETURNING *",
      [title.trim(), makeSlug(title), category, excerpt.trim(), imageUrl, status, status],
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    removeUploadedFile(req.file);
    handleDatabaseError(error, res, next);
  }
});

router.put("/:id", upload.single("image"), async (req, res, next) => {
  if (!validId(req.params.id)) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "id must be a positive integer" });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "Request body must be a form or JSON object" });
  }
  const errors = validateArticle(req.body);
  if (errors.length) {
    removeUploadedFile(req.file);
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  const { title, category, excerpt, status } = req.body;
  const imageUrl = req.file ? `/uploads/news/${req.file.filename}` : null;
  const removeImage = req.body.remove_image === "true";
  try {
    const { rows } = await pool.query(
      "UPDATE news_articles SET title = $1, slug = $2, category = $3, excerpt = $4, " +
      "image_url = CASE WHEN $5::boolean THEN $6 WHEN $7::boolean THEN NULL ELSE image_url END, " +
      "status = $8, published_at = CASE WHEN $9::text = 'Published' THEN COALESCE(published_at, NOW()) ELSE NULL END, " +
      "updated_at = NOW() WHERE id = $10 RETURNING *",
      [title.trim(), makeSlug(title), category, excerpt.trim(), Boolean(req.file), imageUrl, removeImage, status, status, req.params.id],
    );
    if (!rows.length) {
      removeUploadedFile(req.file);
      return res.status(404).json({ error: "Article not found" });
    }
    res.json(rows[0]);
  } catch (error) {
    removeUploadedFile(req.file);
    handleDatabaseError(error, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await pool.query("DELETE FROM news_articles WHERE id = $1 RETURNING image_url", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Article not found" });
    removeStoredImage(rows[0].image_url);
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;

