/**
 * server.js — Proof-Lock Node.js Primary Backend
 * ─────────────────────────────────────────────────────────────
 * Exposes the SAME API routes as the previous Python FastAPI backend.
 * The React frontend requires ZERO changes.
 *
 * Microservice Architecture:
 *   - This server (port 3000): all routing, DB, credentials, ZKP
 *   - Python AI service (port 8001): biometric analysis only
 *
 * Run: node server.js   (or: npm run dev)
 * ─────────────────────────────────────────────────────────────
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ─── Import Routes ─────────────────────────────────────────────
const authRoutes = require("./routes/auth");
const registerRoutes = require("./routes/register");
const credentialRoutes = require("./routes/credential");
const proofsRoutes = require("./routes/proofs");
const adminRoutes = require("./routes/admin");

// ─── App & Middleware ──────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow frontend (port 5173) same as original FastAPI config
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["*"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── File Uploads (Multer) ─────────────────────────────────────
// Stores files temporarily in /tmp before forwarding to Python AI service
const UPLOAD_TMP = path.join(__dirname, "tmp_uploads");
fs.mkdirSync(UPLOAD_TMP, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_TMP),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
});

// ─── Static Uploads ─────────────────────────────────────────────
// Images are now served from Cloudinary URLs stored in the DB.
// Local /uploads route kept only as a fallback for dev environments.
const UPLOADS_DIR = path.join(__dirname, "..", "backend", "uploads");
if (fs.existsSync(UPLOADS_DIR)) {
  app.use("/uploads", express.static(UPLOADS_DIR));
}

// ─── Register Routes ──────────────────────────────────────────
// Auth: POST /api/auth/register, POST /api/auth/login
app.use("/api/auth", authRoutes);

// Register identity: POST /api/register (multipart/form-data with image + video)
app.use(
  "/api/register",
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  registerRoutes
);

// Credentials: POST /api/generate-credential, GET /api/credential/:user_id
app.use("/api", credentialRoutes);

// Proofs + Verify + User Profile:
//   POST /api/proofs/generate
//   POST /api/verify-proof
//   GET  /api/user/:user_id
app.use("/api/proofs", proofsRoutes);          // /api/proofs/generate
app.use("/api", proofsRoutes);                  // /api/verify-proof, /api/user/:id

// Admin: GET /api/admin/dashboard, /api/admin/users, etc.
app.use("/api/admin", adminRoutes);

// ─── Health & Root ─────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Digital Identity Platform API v2 (Node.js)",
    version: "2.0.0",
    ai_service: "http://localhost:8001",
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

// ─── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║   🔐 Proof-Lock Node.js Backend Running         ║");
  console.log(`║   API  → http://localhost:${PORT}                  ║`);
  console.log("║   AI   → http://localhost:8001 (Python)         ║");
  console.log("║   UI   → http://localhost:5173 (React)          ║");
  console.log("╚════════════════════════════════════════════════╝");
  console.log("");
});
