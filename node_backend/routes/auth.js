/**
 * routes/auth.js — Authentication routes
 * Mirrors Python: backend/routes/auth.py
 * Routes: POST /api/auth/register, POST /api/auth/login
 */
const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ detail: "username, email, and password are required" });
    }

    const usernameLower = username.trim().toLowerCase();
    const existing = await db.query("SELECT id FROM users WHERE username = $1", [usernameLower]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ detail: "Username already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, is_verified)
       VALUES ($1, $2, $3, 0) RETURNING id`,
      [usernameLower, email.trim().toLowerCase(), passwordHash]
    );

    return res.json({ message: "User created successfully", user_id: result.rows[0].id });
  } catch (err) {
    console.error("[auth/register]", err);
    return res.status(500).json({ detail: "Registration failed" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ detail: "username and password are required" });
    }

    const usernameLower = username.trim().toLowerCase();
    const result = await db.query("SELECT * FROM users WHERE username = $1", [usernameLower]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ detail: "Invalid username or password" });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ detail: "Invalid username or password" });
    }

    return res.json({
      user_id: user.id,
      username: user.username,
      is_verified: !!user.is_verified,
    });
  } catch (err) {
    console.error("[auth/login]", err);
    return res.status(500).json({ detail: "Login failed" });
  }
});

module.exports = router;
