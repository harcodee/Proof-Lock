/**
 * routes/register.js — Identity Registration
 * Mirrors Python: backend/routes/register.py + services/identity_service.py
 *
 * Flow:
 *   1. Receive multipart form (image + video) from React frontend
 *   2. Upload image → Cloudinary (permanent, cross-service URL)
 *   3. Upload video → Cloudinary (optional)
 *   4. Pass Cloudinary URLs to Python AI microservice for analysis
 *   5. Save results & Cloudinary URL to PostgreSQL (Supabase)
 *
 * Route: POST /api/register
 */
const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const db = require("../db");
const { uploadImage, uploadVideo } = require("../cloudinary");

const router = express.Router();

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "http://localhost:8001/internal/analyze-biometrics";

// Helper: clean up local temp files after upload
function cleanupFiles(files) {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((f) => {
      try { fs.unlinkSync(f.path); } catch (_) {}
    });
}

// POST /api/register
router.post("/", async (req, res) => {
  try {
    const { user_id, name, age, id_number } = req.body;

    // ── Input validation ──────────────────────────────────────────────────
    if (!name || !name.trim()) {
      return res.status(400).json({ detail: "Name cannot be empty" });
    }
    if (!age || parseInt(age) <= 0 || parseInt(age) > 120) {
      return res.status(400).json({ detail: "Age must be between 1 and 120" });
    }
    if (!id_number || !id_number.trim()) {
      return res.status(400).json({ detail: "ID number cannot be empty" });
    }
    if (!user_id) {
      return res.status(400).json({ detail: "user_id is required" });
    }

    // ── Step 1: Upload files to Cloudinary ────────────────────────────────
    let imageCloudUrl = null;
    let videoCloudUrl = null;

    if (req.files?.image?.[0]) {
      try {
        const { secure_url } = await uploadImage(req.files.image[0].path);
        imageCloudUrl = secure_url;
        console.log("[register] Image uploaded to Cloudinary:", imageCloudUrl);
      } catch (uploadErr) {
        console.warn("[register] Cloudinary image upload failed:", uploadErr.message);
      }
    }

    if (req.files?.video?.[0]) {
      try {
        const { secure_url } = await uploadVideo(req.files.video[0].path);
        videoCloudUrl = secure_url;
        console.log("[register] Video uploaded to Cloudinary:", videoCloudUrl);
      } catch (uploadErr) {
        console.warn("[register] Cloudinary video upload failed:", uploadErr.message);
      }
    }

    // ── Step 2: Call Python AI microservice with Cloudinary URLs ──────────
    // The AI service will download from the URL instead of receiving raw bytes.
    // This works across separate Render services since URLs are public.
    const formData = new FormData();
    if (imageCloudUrl) formData.append("image_url", imageCloudUrl);
    if (videoCloudUrl) formData.append("video_url", videoCloudUrl);
    if (req.files?.image?.[0]) formData.append("file_size_bytes", req.files.image[0].size.toString());

    // Fallback: also send raw file if Cloudinary failed (AI service accepts both)
    if (!imageCloudUrl && req.files?.image?.[0]) {
      formData.append("image", fs.createReadStream(req.files.image[0].path), req.files.image[0].originalname);
    }
    if (!videoCloudUrl && req.files?.video?.[0]) {
      formData.append("video", fs.createReadStream(req.files.video[0].path), req.files.video[0].originalname);
    }

    let aiResult = {
      fraud_score: "MEDIUM",
      liveness_score: 0.5,
      doc_verified: false,
      image_path: imageCloudUrl,
      trust: {
        composite_score: 0.5,
        composite_pct: "50%",
        tier: "MEDIUM",
        tier_label: "Moderate Confidence — 50%",
        signals: {},
        flags: ["no_biometrics_provided"],
        model_version: "v2.0",
      },
    };

    try {
      const aiResponse = await axios.post(AI_SERVICE_URL, formData, {
        headers: formData.getHeaders(),
        timeout: 30000,
      });
      aiResult = aiResponse.data;
      // Always use the Cloudinary URL as image_path (AI service returns its local tmp path)
      if (imageCloudUrl) aiResult.image_path = imageCloudUrl;
    } catch (aiErr) {
      console.warn("[register] AI service unavailable, using default scores:", aiErr.message);
    }

    // ── Step 3: Clean up local temp files ─────────────────────────────────
    cleanupFiles(req.files);

    // ── Step 4: Save results to Supabase ──────────────────────────────────
    const userRes = await db.query("SELECT * FROM users WHERE id = $1", [parseInt(user_id)]);
    const user = userRes.rows[0];
    if (!user) {
      return res.status(404).json({ detail: "User not found" });
    }

    // Store the Cloudinary URL as image_path (permanent, publicly accessible)
    await db.query(
      `UPDATE users SET
        name           = $1,
        age            = $2,
        id_number      = $3,
        image_path     = $4,
        fraud_score    = $5,
        liveness_score = $6,
        doc_verified   = $7,
        is_verified    = 1,
        version        = 2
       WHERE id = $8`,
      [
        name.trim(),
        parseInt(age),
        id_number.trim(),
        aiResult.image_path || null,   // Cloudinary secure_url
        aiResult.fraud_score,
        aiResult.liveness_score,
        aiResult.doc_verified ? 1 : 0,
        parseInt(user_id),
      ]
    );

    await db.query(
      `INSERT INTO trust_results (user_id, composite_score, tier, signals, flags, model_version, reviewed_at)
       VALUES ($1, $2, $3, $4, $5, $6, to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))`,
      [
        parseInt(user_id),
        aiResult.trust.composite_score,
        aiResult.trust.tier,
        JSON.stringify(aiResult.trust.signals),
        JSON.stringify(aiResult.trust.flags),
        aiResult.trust.model_version,
      ]
    );

    await db.query(
      `INSERT INTO audit_log (actor, action, target_id, detail) VALUES ($1, 'identity_registered', $2, $3)`,
      [
        String(user_id),
        String(user_id),
        `Trust tier: ${aiResult.trust.tier}, Score: ${aiResult.trust.composite_score}`,
      ]
    );

    return res.json({
      user_id: parseInt(user_id),
      name: name.trim(),
      age: parseInt(age),
      fraud_score: aiResult.fraud_score,
      trust: aiResult.trust,
      image_url: imageCloudUrl,
      intake: { hash: null, metadata: {} },
    });
  } catch (err) {
    console.error("[register]", err);
    cleanupFiles(req.files);
    return res.status(500).json({ detail: `Registration failed: ${err.message}` });
  }
});

module.exports = router;
