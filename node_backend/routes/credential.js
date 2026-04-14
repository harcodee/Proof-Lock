/**
 * routes/credential.js — Verifiable Credential issuance and retrieval
 * Mirrors Python: backend/routes/credential.py + services/credential_issuer.py
 * Routes: POST /api/generate-credential, GET /api/credential/:user_id
 */
const express = require("express");
const db = require("../db");
const { sha256, generateDID } = require("../crypto");

const router = express.Router();

const DEFAULT_EXPIRY_DAYS = 365;

// POST /api/generate-credential
router.post("/generate-credential", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ detail: "user_id is required" });

    const userRes = await db.query("SELECT * FROM users WHERE id = $1", [parseInt(user_id)]);
    const user = userRes.rows[0];
    if (!user) return res.status(404).json({ detail: `User with id ${user_id} not found` });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 86400000);

    const fraudToTier = { LOW: "HIGH", MEDIUM: "MEDIUM", HIGH: "LOW" };

    const credentialData = {
      user_id: user.id,
      name: user.name,
      age: user.age,
      fraud_score: user.fraud_score,
      trust_tier: fraudToTier[user.fraud_score] || "UNVERIFIED",
      verified: true,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      issuer: "DigitalIDPlatform/v2",
      credential_type: "VerifiableIdentityCredential",
      version: 2,
    };

    // Generate DID
    const did = generateDID(user.id, credentialData);
    credentialData.did = did;

    // Sign credential
    const jsonStr = JSON.stringify(credentialData, Object.keys(credentialData).sort());
    const signature = sha256(jsonStr);

    // Proof token
    const proofPayload = {
      did,
      signature,
      issued_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };
    const proofToken = sha256(JSON.stringify(proofPayload, Object.keys(proofPayload).sort()));

    // Save to DB
    const result = await db.query(
      `INSERT INTO credentials (user_id, data, signature, issued_at, did, status, expires_at, proof_token, version)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', $6, $7, 2) RETURNING id`,
      [user.id, jsonStr, signature, now.toISOString(), did, expiresAt.toISOString(), proofToken]
    );
    const credentialId = result.rows[0].id;

    // Audit log
    await db.query(
      `INSERT INTO audit_log (actor, action, target_id, detail) VALUES ($1, 'credential_issued', $2, $3)`,
      [String(user.id), String(credentialId), `Issued DID: ${did}`]
    );

    return res.json({
      credential: credentialData,
      credential_id: credentialId,
      did,
      signature,
      signature_short: signature.slice(0, 16) + "...",
      proof_token: proofToken,
      status: "ACTIVE",
      expires_at: expiresAt.toISOString(),
      issued_at: now.toISOString(),
    });
  } catch (err) {
    console.error("[generate-credential]", err);
    return res.status(500).json({ detail: `Credential generation failed: ${err.message}` });
  }
});

// GET /api/credential/:user_id
router.get("/credential/:user_id", async (req, res) => {
  try {
    const userId = parseInt(req.params.user_id);
    const result = await db.query(
      "SELECT * FROM credentials WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
      [userId]
    );
    const credential = result.rows[0];
    if (!credential) {
      return res.status(404).json({ detail: `No credential found for user ${userId}` });
    }

    // Auto-check expiry
    let status = credential.status;
    if (credential.expires_at && new Date(credential.expires_at) < new Date()) {
      status = "EXPIRED";
      await db.query("UPDATE credentials SET status = 'EXPIRED' WHERE id = $1", [credential.id]);
    }

    return res.json({
      credential: JSON.parse(credential.data),
      credential_id: credential.id,
      did: credential.did,
      signature: credential.signature,
      signature_short: credential.signature.slice(0, 16) + "...",
      proof_token: credential.proof_token,
      status,
      expires_at: credential.expires_at,
      issued_at: credential.issued_at,
    });
  } catch (err) {
    console.error("[credential/:user_id]", err);
    return res.status(500).json({ detail: `Failed to fetch credential: ${err.message}` });
  }
});

module.exports = router;
