const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

const adminAuth = require("./routes/adminAuth");
const playersRouter = require("./routes/players");
const fixturesRouter = require("./routes/fixtures");
const resultsRouter = require("./routes/results");
const newsRouter = require("./routes/news");
const tableRouter = require("./routes/table");
const uploadsRouter = require("./routes/uploads");
const donationsRouter = require("./routes/donations");

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", adminAuth.requireAdminSession, uploadsRouter);
app.use("/api/donations", donationsRouter);

app.use("/api/admin", adminAuth.router);

// Public pages can read these lists, but changes require admin sign-in.
app.use("/api/players", adminAuth.requireAdminForWrites, playersRouter);
app.use("/api/fixtures", adminAuth.requireAdminForWrites, fixturesRouter);
app.use("/api/results", adminAuth.requireAdminForWrites, resultsRouter);

// Published news stays public. Drafts and admin changes require sign-in.
app.use("/api/news", (req, res, next) => {
  const isPublishedNews =
    req.method === "GET" && req.path.replace(/\/+$/, "") === "/published";

  if (isPublishedNews) return next();
  return adminAuth.requireAdminSession(req, res, next);
}, newsRouter);

// Public visitors can see standings. Managing league teams and matches
// requires admin sign-in.
app.use("/api/table", (req, res, next) => {
  const isPublicStandings =
    req.method === "GET" && req.path.replace(/\/+$/, "") === "/standings";

  if (isPublicStandings) return next();
  return adminAuth.requireAdminSession(req, res, next);
}, tableRouter);

app.get("/", (req, res) => {
  res.json({
    message: "Starehe FC API is running!",
    status: "success",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    service: "Starehe FC Backend",
  });
});

app.use((err, req, res, next) => {
  console.error("API request failed:", err.message);

  if (res.headersSent) return next(err);

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Malformed JSON request body" });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "Choose an image that is 5 MB or smaller.",
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      error: "Only one image can be uploaded per article.",
    });
  }

  if (err.status === 400) {
    return res.status(400).json({ error: err.message });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({ error: "Request body is too large" });
  }

  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Starehe FC API running at http://localhost:${PORT}`);
});