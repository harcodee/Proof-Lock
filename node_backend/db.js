/**
 * db.js — PostgreSQL (Supabase) Database Client
 * Uses the `pg` package with a connection pool.
 * All queries are async — use `await db.query(sql, params)`.
 *
 * Tables are created automatically on first run via initDb().
 */
const { Pool } = require("pg");

// Use explicit params instead of a connection string to avoid URL-encoding
// issues with special characters in the password (e.g. # [ ]).
// On Render, set DATABASE_URL and it will be used automatically by pg if you
// prefer — or keep using the explicit params below via individual env vars.
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  : new Pool({
      host: process.env.DB_HOST || "aws-1-ap-southeast-1.pooler.supabase.com",
      port: parseInt(process.env.DB_PORT || "5432"),
      database: process.env.DB_NAME || "postgres",
      user: process.env.DB_USER || "postgres.pctbowdolgvlidtupipq",
      password: process.env.DB_PASSWORD || "Har7bts1nefftech#",
      ssl: { rejectUnauthorized: false },
    });

// ─── Schema Init ──────────────────────────────────────────────────────────────
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id             SERIAL PRIMARY KEY,
        name           TEXT,
        age            INTEGER,
        id_number      TEXT UNIQUE,
        username       TEXT UNIQUE,
        email          TEXT,
        password_hash  TEXT,
        is_verified    INTEGER DEFAULT 0,
        image_path     TEXT,
        fraud_score    TEXT,
        liveness_score REAL DEFAULT 0.0,
        doc_verified   INTEGER DEFAULT 0,
        intake_hash    TEXT,
        version        INTEGER DEFAULT 1,
        created_at     TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      );

      CREATE TABLE IF NOT EXISTS credentials (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER NOT NULL REFERENCES users(id),
        data           TEXT NOT NULL,
        signature      TEXT NOT NULL,
        issued_at      TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
        did            TEXT UNIQUE,
        status         TEXT DEFAULT 'ACTIVE',
        expires_at     TEXT,
        proof_token    TEXT,
        revoked_reason TEXT,
        version        INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS proofs (
        id               SERIAL PRIMARY KEY,
        user_id          INTEGER NOT NULL REFERENCES users(id),
        condition        TEXT NOT NULL,
        result           INTEGER NOT NULL,
        proof_id         TEXT NOT NULL UNIQUE,
        created_at       TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
        claims           TEXT,
        disclosed_fields TEXT,
        reusable         INTEGER DEFAULT 0,
        used_count       INTEGER DEFAULT 0,
        max_uses         INTEGER,
        expires_at       TEXT
      );

      CREATE TABLE IF NOT EXISTS trust_results (
        id              SERIAL PRIMARY KEY,
        user_id         INTEGER NOT NULL REFERENCES users(id),
        composite_score REAL DEFAULT 0.0,
        tier            TEXT DEFAULT 'UNVERIFIED',
        signals         TEXT,
        flags           TEXT,
        model_version   TEXT DEFAULT 'v2.0',
        reviewed_at     TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id           SERIAL PRIMARY KEY,
        actor        TEXT NOT NULL,
        action       TEXT NOT NULL,
        target_id    TEXT,
        detail       TEXT,
        prev_hash    TEXT,
        current_hash TEXT,
        ts           TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id         SERIAL PRIMARY KEY,
        key_hash   TEXT NOT NULL UNIQUE,
        owner      TEXT NOT NULL,
        scopes     TEXT,
        created_at TEXT DEFAULT (to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')),
        last_used  TEXT,
        is_active  INTEGER DEFAULT 1
      );
    `);
    console.log("✅ Supabase PostgreSQL — tables verified/created.");
  } finally {
    client.release();
  }
}

// Run schema init immediately when this module is first loaded
initDb().catch((err) => {
  console.error("❌ Database init failed:", err.message);
  process.exit(1);
});

// Export pool directly — all routes use: await db.query(sql, [params])
module.exports = pool;
