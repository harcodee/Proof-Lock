/**
 * crypto.js — Cryptographic utilities for Node.js backend
 * Mirrors the Python credential_issuer.py and proof_engine.py crypto logic.
 */
const crypto = require("crypto");

const HMAC_SECRET = "ivp-proof-engine-secret-v2"; // Must match Python backend

/**
 * SHA-256 hash of any string
 */
function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * HMAC-SHA256 signing — mirrors Python proof_engine.sign_proof_token()
 */
function hmacSign(payload) {
  return crypto
    .createHmac("sha256", HMAC_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * Generates a DID: did:ivp:<sha256_prefix> — mirrors Python generate_did()
 */
function generateDID(userId, credentialData) {
  const seed = `${userId}:${JSON.stringify(credentialData)}:${crypto.randomUUID()}`;
  const digest = sha256(seed);
  return `did:ivp:${digest.slice(0, 32)}`;
}

module.exports = { sha256, hmacSign, generateDID };
