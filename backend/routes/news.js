const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const pool = require("../db");
const { uploadImage, deleteImage } = require("../storage");

const router = express.Router();
const categories = ["Club News", "Match Reports", "Team News", "Community", "Announcements"];
const statuses = ["Draft", "Published"];
const uploadDirectory = path.join(__dirname, "..", "uploads", "news");
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10, fields: 12, fieldSize: 64 * 1024 },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error("Choose JPG, PNG, WebP, or GIF images.");
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
  if (typeof body.category !== "string" || !categories.includes(body.category)) errors.push(`category must be one of: ${categories.join(", ")}`);
  if (typeof body.excerpt !== "string" || !body.excerpt.trim()) errors.push("excerpt is required");
  else if (body.excerpt.trim().length > 500) errors.push("excerpt must be 500 characters or fewer");
  if (typeof body.status !== "string" || !statuses.includes(body.status)) errors.push("status must be Draft or Published");
  if (body.content !== undefined && typeof body.content !== "string") errors.push("content must be text");
  if (body.image_url !== undefined && body.image_url !== null && typeof body.image_url !== "string") errors.push("image_url must be a string or null");
  return errors;
}

function removeStoredImage(imageUrl) {
  if (typeof imageUrl !== "string" || !imageUrl) return;
  if (imageUrl.startsWith("/uploads/news/")) {
    const filename = imageUrl.slice("/uploads/news/".length);
    if (path.basename(filename) === filename) fs.unlink(path.join(uploadDirectory, filename), () => {});
    return;
  }
  deleteImage(imageUrl).catch((error) => console.error("Could not remove stored news image:", error.message));
}

function cleanupImages(urls) {
  urls.forEach(removeStoredImage);
}

function handleDatabaseError(error, res, next) {
  if (error.code === "23505") return res.status(409).json({ error: "An article with this headline already exists" });
  if (["22P02", "23514", "23502"].includes(error.code)) return res.status(400).json({ error: "Invalid article data" });
  return next(error);
}

async function articleQuery(whereSql, values = [], orderSql = "") {
  return pool.query(
    "SELECT news_item.*, COALESCE(JSON_AGG(json_build_object('id', gallery.id, 'image_url', gallery.image_url, 'display_order', gallery.display_order) ORDER BY gallery.display_order, gallery.id) FILTER (WHERE gallery.id IS NOT NULL), '[]'::json) AS images " +
      "FROM news_articles news_item LEFT JOIN news_article_images gallery ON gallery.news_article_id = news_item.id " +
      `${whereSql} GROUP BY news_item.id ${orderSql}`,
    values,
  );
}

async function uploadFiles(files = []) {
  const urls = [];
  try {
    for (const file of files) urls.push(await uploadImage(file, "news"));
    return urls;
  } catch (error) {
    cleanupImages(urls);
    throw error;
  }
}

async function insertGallery(articleId, urls, startOrder = 0) {
  for (let index = 0; index < urls.length; index += 1) {
    await pool.query(
      "INSERT INTO news_article_images (news_article_id, image_url, display_order) VALUES ($1, $2, $3)",
      [articleId, urls[index], startOrder + index],
    );
  }
}

router.get("/", async (req, res, next) => {
  try {
    const { rows } = await articleQuery("WHERE TRUE", [], "ORDER BY news_item.updated_at DESC, news_item.id DESC");
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/published", async (req, res, next) => {
  try {
    const { rows } = await articleQuery(
      "WHERE news_item.status = 'Published'",
      [],
      "ORDER BY news_item.published_at DESC NULLS LAST, news_item.updated_at DESC, news_item.id DESC",
    );
    res.json(rows);
  } catch (error) { next(error); }
});

router.get("/published/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await articleQuery("WHERE news_item.id = $1 AND news_item.status = 'Published'", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Published article not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.get("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const { rows } = await articleQuery("WHERE news_item.id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: "Article not found" });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post("/", upload.array("images", 10), async (req, res, next) => {
  const files = req.files || [];
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Request body must be a form or JSON object" });
  const errors = validateArticle(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  const { title, category, excerpt, status } = req.body;
  let imageUrls = [];
  try {
    imageUrls = await uploadFiles(files);
    const coverUrl = imageUrls[0] || req.body.image_url?.trim() || null;
    const { rows } = await pool.query(
      "INSERT INTO news_articles (title, slug, category, excerpt, content, image_url, status, published_at) " +
      "VALUES ($1, $2, $3, $4, $5, $6, $7, CASE WHEN $8 THEN NOW() ELSE NULL END) RETURNING *",
      [title.trim(), makeSlug(title), category, excerpt.trim(), req.body.content?.trim() || null, coverUrl, status, status === "Published"],
    );
    const article = rows[0];
    await insertGallery(article.id, imageUrls);
    const saved = await articleQuery("WHERE news_item.id = $1", [article.id]);
    res.status(201).json(saved.rows[0]);
  } catch (error) {
    cleanupImages(imageUrls);
    handleDatabaseError(error, res, next);
  }
});

router.put("/:id", upload.array("images", 10), async (req, res, next) => {
  const files = req.files || [];
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) return res.status(400).json({ error: "Request body must be a form or JSON object" });
  const errors = validateArticle(req.body);
  if (errors.length) return res.status(400).json({ error: "Validation failed", details: errors });
  const { title, category, excerpt, status } = req.body;
  let uploadedUrls = [];
  try {
    const existing = await pool.query(
      "SELECT article.image_url, gallery.id, gallery.image_url AS gallery_url, gallery.display_order FROM news_articles article LEFT JOIN news_article_images gallery ON gallery.news_article_id = article.id WHERE article.id = $1 ORDER BY gallery.display_order, gallery.id",
      [req.params.id],
    );
    if (!existing.rows.length) return res.status(404).json({ error: "Article not found" });
    const oldCover = existing.rows[0].image_url;
    const oldGallery = existing.rows.filter((row) => row.id !== null);
    let removeIds = [];
    try { removeIds = JSON.parse(req.body.remove_image_ids || "[]"); } catch { return res.status(400).json({ error: "remove_image_ids must be a JSON array" }); }
    if (!Array.isArray(removeIds) || removeIds.some((id) => !/^\d+$/.test(String(id)))) return res.status(400).json({ error: "remove_image_ids must contain image IDs" });
    const ownedRemoveIds = new Set(oldGallery.filter((image) => removeIds.includes(String(image.id)) || removeIds.includes(Number(image.id))).map((image) => Number(image.id)));
    const coverInGallery = oldGallery.some((image) => image.gallery_url === oldCover);
    const totalExisting = oldGallery.length + (oldCover && !coverInGallery ? 1 : 0);
    const totalRemoved = ownedRemoveIds.size + (req.body.remove_image === "true" && !coverInGallery ? 1 : 0);
    if (totalExisting - totalRemoved + files.length > 10) {
      return res.status(400).json({ error: "An article can have up to 10 photos." });
    }
    uploadedUrls = await uploadFiles(files);
    const kept = oldGallery.filter((image) => !ownedRemoveIds.has(Number(image.id)));
    const galleryUrls = [...kept.map((image) => image.gallery_url), ...uploadedUrls];
    const coverWasRemoved = req.body.remove_image === "true" || oldGallery.some((image) => ownedRemoveIds.has(Number(image.id)) && image.gallery_url === oldCover);
    const coverUrl = coverWasRemoved ? (galleryUrls[0] || null) : (oldCover || galleryUrls[0] || null);

    if (ownedRemoveIds.size) {
      await pool.query("DELETE FROM news_article_images WHERE news_article_id = $1 AND id = ANY($2::bigint[])", [req.params.id, [...ownedRemoveIds]]);
    }
    await insertGallery(req.params.id, uploadedUrls, kept.length);
    await pool.query(
      "UPDATE news_articles SET title = $1, slug = $2, category = $3, excerpt = $4, content = $5, image_url = $6, status = $7, " +
      "published_at = CASE WHEN $8 THEN COALESCE(published_at, NOW()) ELSE NULL END, updated_at = NOW() WHERE id = $9 RETURNING *",
      [title.trim(), makeSlug(title), category, excerpt.trim(), req.body.content?.trim() || null, coverUrl, status, status === "Published", req.params.id],
    );
    const removedUrls = oldGallery.filter((image) => ownedRemoveIds.has(Number(image.id))).map((image) => image.gallery_url);
    if (coverWasRemoved && oldCover && oldCover !== coverUrl && !oldGallery.some((image) => !ownedRemoveIds.has(Number(image.id)) && image.gallery_url === oldCover)) removedUrls.push(oldCover);
    cleanupImages([...new Set(removedUrls)]);
    const saved = await articleQuery("WHERE news_item.id = $1", [req.params.id]);
    res.json(saved.rows[0]);
  } catch (error) {
    cleanupImages(uploadedUrls);
    handleDatabaseError(error, res, next);
  }
});

router.delete("/:id", async (req, res, next) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: "id must be a positive integer" });
  try {
    const images = await pool.query(
      "SELECT image_url FROM news_articles WHERE id = $1 UNION SELECT image_url FROM news_article_images WHERE news_article_id = $1",
      [req.params.id],
    );
    if (!images.rows.length) return res.status(404).json({ error: "Article not found" });
    await pool.query("DELETE FROM news_articles WHERE id = $1", [req.params.id]);
    cleanupImages([...new Set(images.rows.map((row) => row.image_url))]);
    res.status(204).end();
  } catch (error) { next(error); }
});

module.exports = router;
