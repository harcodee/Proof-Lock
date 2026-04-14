/**
 * routes/admin.js — Admin Dashboard Routes
 * Mirrors Python: backend/routes/admin.py
 * Routes: GET /api/admin/dashboard, /users, /verifications, /logs
 */
const express = require("express");
const db = require("../db");

const router = express.Router();

// GET /api/admin/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const totalUsersRes = await db.query("SELECT COUNT(*) AS c FROM users");
    const totalUsers = parseInt(totalUsersRes.rows[0].c);

    const verificationsRes = await db.query("SELECT COUNT(*) AS c FROM proofs");
    const verifications = parseInt(verificationsRes.rows[0].c);

    const successRes = await db.query("SELECT COUNT(*) AS c FROM proofs WHERE result = 1");
    const success = parseInt(successRes.rows[0].c);
    const successRate = verifications > 0 ? Math.round((success / verifications) * 1000) / 10 : 100;

    const trustsRes = await db.query("SELECT tier, composite_score FROM trust_results");
    const trusts = trustsRes.rows;
    const alerts = trusts.filter((t) => t.tier === "LOW" || t.composite_score < 40).length;

    return res.json({
      total_users: totalUsers,
      total_verifications: verifications,
      success_rate: successRate,
      active_alerts: alerts,
    });
  } catch (err) {
    console.error("[admin/dashboard]", err);
    return res.status(500).json({ detail: "Failed to fetch dashboard stats" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const usersRes = await db.query("SELECT * FROM users");
    const users = usersRes.rows;

    const result = await Promise.all(
      users.map(async (u) => {
        const trustRes = await db.query(
          "SELECT * FROM trust_results WHERE user_id = $1 ORDER BY id DESC LIMIT 1",
          [u.id]
        );
        const trust = trustRes.rows[0];
        return {
          id: `USR-${String(u.id).padStart(6, "0")}`,
          username: u.username || u.name,
          status: u.is_verified
            ? "VERIFIED"
            : trust && trust.tier === "LOW"
            ? "FLAGGED"
            : "PENDING",
          lastActivity: u.created_at,
          risk: trust ? trust.composite_score : 0,
        };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error("[admin/users]", err);
    return res.status(500).json({ detail: "Failed to fetch users" });
  }
});

// GET /api/admin/verifications
router.get("/verifications", async (req, res) => {
  try {
    const proofsRes = await db.query("SELECT * FROM proofs ORDER BY created_at DESC");
    const proofs = proofsRes.rows;

    const result = await Promise.all(
      proofs.map(async (p) => {
        const userRes = await db.query("SELECT username FROM users WHERE id = $1", [p.user_id]);
        const user = userRes.rows[0];
        return {
          id: `VER-${p.id}`,
          user: user ? user.username : "Unknown",
          matchScore: p.result ? 95.0 : 35.0,
          status: p.result ? "APPROVED" : "REJECTED",
          time: p.created_at,
        };
      })
    );

    return res.json(result);
  } catch (err) {
    console.error("[admin/verifications]", err);
    return res.status(500).json({ detail: "Failed to fetch verifications" });
  }
});

// GET /api/admin/logs
router.get("/logs", async (req, res) => {
  try {
    const logsRes = await db.query("SELECT * FROM audit_log ORDER BY ts DESC LIMIT 50");
    return res.json(logsRes.rows);
  } catch (err) {
    console.error("[admin/logs]", err);
    return res.status(500).json({ detail: "Failed to fetch logs" });
  }
});

module.exports = router;
