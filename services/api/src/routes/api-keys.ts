import { Router } from "express";
import crypto from "crypto";
import { getPool } from "../lib/db.js";

export const apiKeysRouter = Router();

function generateApiKey(): { key: string; prefix: string; hash: string } {
  const key = "spk_" + crypto.randomBytes(32).toString("hex");
  const prefix = key.slice(0, 12);
  const hash = crypto.createHash("sha256").update(key).digest("hex");
  return { key, prefix, hash };
}

// List user's API keys (never return the full key)
apiKeysRouter.get("/", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json([]);
    return;
  }
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, name, key_prefix, last_used, expires_at, revoked, created_at
       FROM api_keys WHERE user_id = $1 AND revoked = false
       ORDER BY created_at DESC`,
      [req.user!.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("List API keys error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create a new API key
apiKeysRouter.post("/", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(400).json({ error: "Database required" });
    return;
  }
  const { name, expiresInDays } = req.body as { name?: string; expiresInDays?: number };
  if (!name) {
    res.status(400).json({ error: "name is required" });
    return;
  }

  try {
    const pool = getPool();
    const { key, prefix, hash } = generateApiKey();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null;

    const result = await pool.query(
      `INSERT INTO api_keys (user_id, name, key_hash, key_prefix, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, key_prefix, expires_at, created_at`,
      [req.user!.userId, name, hash, prefix, expiresAt]
    );

    // Return the full key ONCE — it's never stored or retrievable again
    res.status(201).json({
      ...result.rows[0],
      key,
    });
  } catch (err) {
    console.error("Create API key error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Revoke an API key
apiKeysRouter.delete("/:id", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      "UPDATE api_keys SET revoked = true WHERE id = $1 AND user_id = $2 RETURNING id",
      [req.params.id, req.user!.userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "API key not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Revoke API key error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
