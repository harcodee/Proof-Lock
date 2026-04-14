/**
 * routes/proofs.js — ZKP Selective Disclosure Proof Generation & Verification
 * Mirrors Python: backend/routes/proofs.py + services/proof_engine.py
 * Routes: POST /api/proofs/generate, POST /api/verify-proof, GET /api/user/:user_id
 */
const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");
const { hmacSign } = require("../crypto");

const router = express.Router();

const DEFAULT_TTL_MINUTES = 15;

// ─── Claim Generation ──────────────────────────────────────────────────────────
function generateClaims(user, trustResult) {
  const now = new Date().toISOString();
  const expiry = new Date(Date.now() + 24 * 3600000).toISOString();

  const claims = {
    age_over_18: {
      type: "age_over_18",
      value: user.age >= 18,
      verified_at: now,
      expiry,
      disclosure: "FULL",
    },
    age_over_21: {
      type: "age_over_21",
      value: user.age >= 21,
      verified_at: now,
      expiry,
      disclosure: "FULL",
    },
    face_verified: {
      type: "face_verified",
      value: user.fraud_score === "LOW",
      verified_at: now,
      expiry,
      disclosure: "FULL",
    },
    doc_valid: {
      type: "doc_valid",
      value: !!user.doc_verified,
      verified_at: now,
      expiry,
      disclosure: "FULL",
    },
    identity_verified: {
      type: "identity_verified",
      value: user.fraud_score === "LOW" || user.fraud_score === "MEDIUM",
      verified_at: now,
      expiry,
      disclosure: "FULL",
    },
  };

  if (trustResult) {
    claims.trust_tier = {
      type: "trust_tier",
      value: trustResult.tier,
      verified_at: now,
      expiry,
      disclosure: "FULL",
    };
  }

  return claims;
}

// ─── Selective Disclosure ──────────────────────────────────────────────────────
function applySelectiveDisclosure(claims, disclosedFields) {
  const result = {};
  for (const [key, claim] of Object.entries(claims)) {
    if (disclosedFields.includes(key)) {
      result[key] = { ...claim, disclosure: "FULL" };
    } else {
      result[key] = {
        type: claim.type,
        value: "[HIDDEN]",
        verified_at: claim.verified_at,
        disclosure: "HIDDEN",
      };
    }
  }
  return result;
}

// POST /api/proofs/generate
router.post("/generate", async (req, res) => {
  try {
    const {
      user_id,
      disclosed_fields,
      reusable = false,
      max_uses = null,
      ttl_minutes = DEFAULT_TTL_MINUTES,
    } = req.body;

    if (!user_id || !disclosed_fields || !Array.isArray(disclosed_fields)) {
      return res
        .status(400)
        .json({ detail: "user_id and disclosed_fields (array) are required" });
    }

    const userRes = await db.query("SELECT * FROM users WHERE id = $1", [parseInt(user_id)]);
    const user = userRes.rows[0];
    if (!user) return res.status(400).json({ detail: `User with id ${user_id} not found` });

    // Get latest trust result
    const trustRes = await db.query(
      "SELECT * FROM trust_results WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
      [parseInt(user_id)]
    );
    const trustResult = trustRes.rows[0];

    // Get credential DID
    const credRes = await db.query(
      "SELECT did FROM credentials WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
      [parseInt(user_id)]
    );
    const did = credRes.rows[0] ? credRes.rows[0].did : `did:ivp:temp:${user_id}`;

    // Generate + apply claims
    const allClaims = generateClaims(user, trustResult);
    const disclosed = applySelectiveDisclosure(allClaims, disclosed_fields);

    // Only fully-disclosed claims get signed
    const fullDisclosed = Object.fromEntries(
      Object.entries(disclosed).filter(([, v]) => v.disclosure === "FULL")
    );

    // Sign proof
    const proofToken = hmacSign({ claims: fullDisclosed, did, signed_at: new Date().toISOString() });

    // Calculate overall result
    const result = Object.values(fullDisclosed).some(
      (v) => typeof v.value === "boolean" && v.value === true
    );

    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl_minutes * 60000);
    const proofId = uuidv4();

    // Save proof record
    await db.query(
      `INSERT INTO proofs
         (user_id, condition, result, proof_id, created_at, claims, disclosed_fields, reusable, used_count, max_uses, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10)`,
      [
        parseInt(user_id),
        `selective_disclosure:${disclosed_fields.join(",")}`,
        result ? 1 : 0,
        proofId,
        now.toISOString(),
        JSON.stringify(disclosed),
        JSON.stringify(disclosed_fields),
        reusable ? 1 : 0,
        max_uses,
        expiresAt.toISOString(),
      ]
    );

    // Audit log
    await db.query(
      `INSERT INTO audit_log (actor, action, target_id, detail) VALUES ($1, 'proof_generated', $2, $3)`,
      [String(user_id), proofId, `Disclosed: ${disclosed_fields.join(", ")}`]
    );

    // Build all_claims response
    const allClaimsResponse = Object.fromEntries(
      Object.entries(allClaims).map(([k, v]) => [
        k,
        { ...v, value: disclosed_fields.includes(k) ? v.value : "[HIDDEN]" },
      ])
    );

    return res.json({
      proof_id: proofId,
      did,
      result,
      disclosed_claims: disclosed,
      all_claims: allClaimsResponse,
      proof_token: proofToken,
      reusable,
      max_uses,
      ttl_minutes,
      expires_at: expiresAt.toISOString(),
      data_revealed: false,
    });
  } catch (err) {
    console.error("[proofs/generate]", err);
    return res.status(500).json({ detail: `Proof generation failed: ${err.message}` });
  }
});

// POST /api/verify-proof
router.post("/verify-proof", async (req, res) => {
  try {
    const { proof_id } = req.body;
    if (!proof_id) return res.status(400).json({ detail: "proof_id is required" });

    const proofRes = await db.query("SELECT * FROM proofs WHERE proof_id = $1", [proof_id]);
    const proof = proofRes.rows[0];
    if (!proof) return res.status(404).json({ detail: "Proof not found" });

    // Check expiry
    if (proof.expires_at && new Date(proof.expires_at) < new Date()) {
      return res.status(404).json({ detail: "Proof expired" });
    }
    // Check max uses
    if (proof.max_uses && proof.used_count >= proof.max_uses) {
      return res.status(404).json({ detail: "Proof max uses exceeded" });
    }

    // Increment used count
    await db.query("UPDATE proofs SET used_count = used_count + 1 WHERE proof_id = $1", [proof_id]);

    return res.json({
      status: proof.result ? "ACCESS_GRANTED" : "ACCESS_DENIED",
      message: proof.result ? "Access granted" : "Access denied",
      proof_id: proof.proof_id,
      statement: "Selective Disclosure",
      data_revealed: false,
    });
  } catch (err) {
    console.error("[verify-proof]", err);
    return res.status(500).json({ detail: `Verification failed: ${err.message}` });
  }
});

// GET /api/user/:user_id
router.get("/user/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    const userRes = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ detail: "User not found" });

    const trustRes = await db.query(
      "SELECT * FROM trust_results WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
      [userId]
    );
    const trust = trustRes.rows[0];

    const idMasked =
      user.id_number && user.id_number.length > 4
        ? user.id_number.slice(0, 4) + "*****"
        : "****";

    return res.json({
      user_id: user.id,
      name: user.name,
      id_number_masked: idMasked,
      fraud_score: user.fraud_score,
      trust_tier: trust ? trust.tier : "UNVERIFIED",
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("[user/:user_id]", err);
    return res.status(500).json({ detail: "Failed to fetch user" });
  }
});

module.exports = router;
