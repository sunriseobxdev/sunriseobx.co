import { Router } from "express";
import { getPool } from "../lib/db.js";
import {
  generateSecret,
  getTotpUri,
  generateQRDataUri,
  validateCode,
  generateRecoveryCodes,
  hashRecoveryCode,
} from "../lib/totp.js";

export const totpRouter = Router();

function getClientIp(req: import("express").Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || null;
}

async function auditLog(
  userId: string,
  action: string,
  ip: string | null
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO audit_log (user_id, action, resource, details, ip_address)
     VALUES ($1, $2, 'totp', '{}', $3)`,
    [userId, action, ip]
  );
}

// GET /api/totp/status — check TOTP status
totpRouter.get("/status", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.json({ enabled: false });
    return;
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT totp_enabled FROM users WHERE id = $1",
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ enabled: !!result.rows[0].totp_enabled });
  } catch (err) {
    console.error("TOTP status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/totp/setup — generate secret and QR code
totpRouter.post("/setup", async (req, res) => {
  if (!process.env.DATABASE_URL) {
    res.status(400).json({ error: "Database required for TOTP" });
    return;
  }

  try {
    const pool = getPool();
    const userId = req.user!.userId;

    const userResult = await pool.query(
      "SELECT email, totp_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    if (userResult.rows[0].totp_enabled) {
      res.status(400).json({ error: "TOTP is already enabled" });
      return;
    }

    const email = userResult.rows[0].email;
    const secret = generateSecret();
    const uri = getTotpUri(secret, email);
    const qrCodeDataUri = await generateQRDataUri(uri);

    // Store secret but don't enable yet
    await pool.query(
      "UPDATE users SET totp_secret = $1, updated_at = NOW() WHERE id = $2",
      [secret, userId]
    );

    await auditLog(userId, "totp_setup_initiated", getClientIp(req));

    res.json({ qrCodeDataUri, secret, uri });
  } catch (err) {
    console.error("TOTP setup error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/totp/verify — verify code to activate 2FA
totpRouter.post("/verify", async (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code || code.length !== 6) {
    res.status(400).json({ error: "A 6-digit code is required" });
    return;
  }

  try {
    const pool = getPool();
    const userId = req.user!.userId;

    const userResult = await pool.query(
      "SELECT email, totp_secret, totp_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    if (user.totp_enabled) {
      res.status(400).json({ error: "TOTP is already enabled" });
      return;
    }

    if (!user.totp_secret) {
      res.status(400).json({ error: "TOTP setup not initiated" });
      return;
    }

    const valid = validateCode(user.totp_secret, user.email, code);
    if (!valid) {
      res.status(400).json({ error: "Invalid code. Please try again." });
      return;
    }

    // Enable TOTP
    await pool.query(
      "UPDATE users SET totp_enabled = true, totp_verified_at = NOW(), updated_at = NOW() WHERE id = $1",
      [userId]
    );

    // Generate recovery codes
    const recoveryCodes = generateRecoveryCodes(10);
    for (const rc of recoveryCodes) {
      const hash = hashRecoveryCode(rc);
      await pool.query(
        "INSERT INTO totp_recovery_codes (user_id, code_hash) VALUES ($1, $2)",
        [userId, hash]
      );
    }

    await auditLog(userId, "totp_enabled", getClientIp(req));

    res.json({ enabled: true, recoveryCodes });
  } catch (err) {
    console.error("TOTP verify error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/totp/disable — disable 2FA (requires valid code)
totpRouter.post("/disable", async (req, res) => {
  const { code } = req.body as { code?: string };

  if (!code) {
    res.status(400).json({ error: "A TOTP code is required to disable 2FA" });
    return;
  }

  try {
    const pool = getPool();
    const userId = req.user!.userId;

    const userResult = await pool.query(
      "SELECT email, totp_secret, totp_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = userResult.rows[0];

    if (!user.totp_enabled) {
      res.status(400).json({ error: "TOTP is not enabled" });
      return;
    }

    const valid = validateCode(user.totp_secret, user.email, code);
    if (!valid) {
      res.status(400).json({ error: "Invalid code" });
      return;
    }

    await pool.query(
      "UPDATE users SET totp_enabled = false, totp_secret = NULL, totp_verified_at = NULL, updated_at = NOW() WHERE id = $1",
      [userId]
    );

    // Delete all recovery codes
    await pool.query(
      "DELETE FROM totp_recovery_codes WHERE user_id = $1",
      [userId]
    );

    await auditLog(userId, "totp_disabled", getClientIp(req));

    res.json({ enabled: false });
  } catch (err) {
    console.error("TOTP disable error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
