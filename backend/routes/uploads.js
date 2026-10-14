const express = require("express");
const multer = require("multer");
const { uploadImage } = require("../storage");

const router = express.Router();

const allowedTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.has(file.mimetype)) {
      const error = new Error("Choose a JPG, PNG, WebP, or GIF image.");
      error.status = 400;
      return callback(error);
    }

    callback(null, true);
  },
});

router.post("/player-photo", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "Choose a player photo to upload." });
  }

  try {
    const imageUrl = await uploadImage(req.file, "players");
    res.status(201).json({ imageUrl });
  } catch (error) {
    next(error);
  }
});

router.post("/team-logo", upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: "Choose a team badge image to upload." });
  }

  try {
    const imageUrl = await uploadImage(req.file, "teams");
    res.status(201).json({ imageUrl });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
