import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { authMiddleware } from "../middleware/auth.js";
import { getPool } from "../lib/db.js";
import { getPrivilegesForRole } from "../lib/iam.js";
import { validateCode, hashRecoveryCode } from "../lib/totp.js";

export const authRouter = Router();

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function getClientIp(req: import("express").Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || null;
}

authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  // If DATABASE_URL is set, use DB-backed auth
  if (process.env.DATABASE_URL) {
    try {
      const pool = getPool();
      const result = await pool.query(
        "SELECT id, email, password_hash, display_name, role, privileges, disabled, totp_enabled, totp_secret FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const user = result.rows[0];

      if (user.disabled) {
        res.status(403).json({ error: "Account is disabled" });
        return;
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      // If TOTP is enabled, issue a short-lived pending token instead
      if (user.totp_enabled) {
        const pendingToken = jwt.sign(
          { userId: user.id, email: user.email, pending2fa: true },
          secret,
          { expiresIn: "5m" }
        );
        res.json({ requires2fa: true, pendingToken });
        return;
      }

      const rolePrivileges = getPrivilegesForRole(user.role);
      const extraPrivs: string[] = user.privileges || [];
      const allPrivileges = [
        ...new Set([...rolePrivileges, ...extraPrivs]),
      ];

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
          privileges: allPrivileges,
          displayName: user.display_name,
        },
        secret,
        { expiresIn: "24h" }
      );

      // Create session record
      const tokenHash = hashToken(token);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const ip = getClientIp(req);
      const userAgent = req.headers["user-agent"] || null;

      await pool.query(
        `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, tokenHash, ip, userAgent, expiresAt]
      );

      // Update last_login
      await pool.query(
        "UPDATE users SET last_login = NOW() WHERE id = $1",
        [user.id]
      );

      // Audit log
      await pool.query(
        `INSERT INTO audit_log (user_id, action, resource, details, ip_address)
         VALUES ($1, 'login', 'auth', $2, $3)`,
        [user.id, JSON.stringify({ email: user.email }), ip]
      );

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          role: user.role,
          privileges: allPrivileges,
        },
      });
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      console.error("DB login error:", message);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  // Fallback: single-user env var auth
  const adminEmail = process.env.ADMIN_EMAIL || "admin@sprimage.com";
  const passwordHash = process.env.ADMIN_PASSWORD_HASH;

  if (!passwordHash) {
    res.status(500).json({ error: "ADMIN_PASSWORD_HASH not configured" });
    return;
  }

  if (email !== adminEmail) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = jwt.sign({ email }, secret, { expiresIn: "24h" });
  res.json({ token });
});

authRouter.post("/login/2fa", async (req, res) => {
  const { pendingToken, code } = req.body as {
    pendingToken?: string;
    code?: string;
  };

  if (!pendingToken || !code) {
    res.status(400).json({ error: "pendingToken and code are required" });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  try {
    const decoded = jwt.verify(pendingToken, secret) as Record<string, unknown>;

    if (!decoded.pending2fa || !decoded.userId) {
      res.status(401).json({ error: "Invalid pending token" });
      return;
    }

    const pool = getPool();
    const userId = decoded.userId as string;

    const result = await pool.query(
      "SELECT id, email, password_hash, display_name, role, privileges, totp_secret, totp_enabled FROM users WHERE id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    const user = result.rows[0];

    if (!user.totp_enabled || !user.totp_secret) {
      res.status(400).json({ error: "TOTP is not enabled for this user" });
      return;
    }

    // Try TOTP code first
    let valid = false;
    if (code.length === 6 && /^\d{6}$/.test(code)) {
      valid = validateCode(user.totp_secret, user.email, code);
    }

    // Try recovery code if TOTP didn't match
    if (!valid) {
      const codeHash = hashRecoveryCode(code);
      const rcResult = await pool.query(
        "SELECT id FROM totp_recovery_codes WHERE user_id = $1 AND code_hash = $2 AND used = false",
        [userId, codeHash]
      );
      if (rcResult.rows.length > 0) {
        await pool.query(
          "UPDATE totp_recovery_codes SET used = true WHERE id = $1",
          [rcResult.rows[0].id]
        );
        valid = true;
      }
    }

    if (!valid) {
      res.status(401).json({ error: "Invalid code" });
      return;
    }

    // Issue the real JWT
    const rolePrivileges = getPrivilegesForRole(user.role);
    const extraPrivs: string[] = user.privileges || [];
    const allPrivileges = [...new Set([...rolePrivileges, ...extraPrivs])];

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        privileges: allPrivileges,
        displayName: user.display_name,
      },
      secret,
      { expiresIn: "24h" }
    );

    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const ip = getClientIp(req);
    const userAgent = req.headers["user-agent"] || null;

    await pool.query(
      `INSERT INTO sessions (user_id, token_hash, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, tokenHash, ip, userAgent, expiresAt]
    );

    await pool.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1",
      [user.id]
    );

    await pool.query(
      `INSERT INTO audit_log (user_id, action, resource, details, ip_address)
       VALUES ($1, 'login_2fa', 'auth', $2, $3)`,
      [user.id, JSON.stringify({ email: user.email }), ip]
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        role: user.role,
        privileges: allPrivileges,
      },
    });
  } catch {
    res.status(401).json({ error: "Invalid or expired pending token" });
  }
});

authRouter.post("/logout", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL) {
    // No DB — just acknowledge
    res.json({ success: true });
    return;
  }

  try {
    const pool = getPool();
    const header = req.headers.authorization!;
    const token = header.slice(7);
    const tokenHash = hashToken(token);

    await pool.query(
      "UPDATE sessions SET revoked = true WHERE token_hash = $1",
      [tokenHash]
    );

    const ip = getClientIp(req);
    await pool.query(
      `INSERT INTO audit_log (user_id, action, resource, details, ip_address)
       VALUES ($1, 'logout', 'auth', $2, $3)`,
      [
        req.user!.userId !== "legacy" ? req.user!.userId : null,
        JSON.stringify({ email: req.user!.email }),
        ip,
      ]
    );

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Logout error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

authRouter.post("/verify", authMiddleware, (req, res) => {
  res.json({
    valid: true,
    userId: req.user!.userId,
    email: req.user!.email,
    role: req.user!.role,
    privileges: req.user!.privileges,
    displayName: req.user!.displayName,
  });
});

authRouter.get("/me", authMiddleware, async (req, res) => {
  if (!process.env.DATABASE_URL || req.user!.userId === "legacy") {
    res.json({
      id: req.user!.userId,
      email: req.user!.email,
      role: req.user!.role,
      privileges: req.user!.privileges,
      displayName: req.user!.displayName,
    });
    return;
  }

  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, display_name, role, privileges, disabled, created_at, updated_at, last_login, totp_enabled
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = result.rows[0];
    const rolePrivileges = getPrivilegesForRole(user.role);
    const extraPrivs: string[] = user.privileges || [];
    const allPrivileges = [...new Set([...rolePrivileges, ...extraPrivs])];

    res.json({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      privileges: allPrivileges,
      disabled: user.disabled,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      lastLogin: user.last_login,
      totpEnabled: !!user.totp_enabled,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get me error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});
