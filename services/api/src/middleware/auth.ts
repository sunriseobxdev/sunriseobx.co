import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  privileges: string[];
  displayName?: string;
  pending2fa?: boolean;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

async function authenticateApiKey(
  apiKey: string,
  req: Request
): Promise<JwtPayload | null> {
  if (!process.env.DATABASE_URL) return null;

  try {
    const { getPool } = await import("../lib/db.js");
    const { getPrivilegesForRole } = await import("../lib/iam.js");
    const pool = getPool();
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex");

    const result = await pool.query(
      `SELECT ak.id as key_id, ak.user_id, ak.expires_at, ak.revoked,
              u.email, u.role, u.privileges, u.display_name, u.disabled
       FROM api_keys ak
       JOIN users u ON ak.user_id = u.id
       WHERE ak.key_hash = $1 AND ak.revoked = false`,
      [keyHash]
    );

    if (result.rows.length === 0) return null;
    const row = result.rows[0];

    if (row.disabled) return null;
    if (row.expires_at && new Date(row.expires_at) < new Date()) return null;

    // Update last_used (fire-and-forget)
    pool.query("UPDATE api_keys SET last_used = NOW() WHERE id = $1", [row.key_id]).catch(() => {});

    const rolePrivileges = getPrivilegesForRole(row.role);
    const extraPrivs: string[] = row.privileges || [];
    const allPrivileges = [...new Set([...rolePrivileges, ...extraPrivs])];

    return {
      userId: row.user_id,
      email: row.email,
      role: row.role,
      privileges: allPrivileges,
      displayName: row.display_name,
    };
  } catch {
    return null;
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for API key first
  const apiKey = req.headers["x-api-key"] as string | undefined;
  if (apiKey && apiKey.startsWith("spk_")) {
    authenticateApiKey(apiKey, req).then((user) => {
      if (!user) {
        res.status(401).json({ error: "Invalid API key" });
        return;
      }
      req.user = user;
      next();
    }).catch(() => {
      res.status(401).json({ error: "Unauthorized" });
    });
    return;
  }

  // Fall back to Bearer JWT
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = header.slice(7);
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: "JWT_SECRET not configured" });
    return;
  }

  try {
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;

    // Reject pending 2FA tokens — they're only valid for /auth/login/2fa
    if (decoded.pending2fa) {
      res.status(401).json({ error: "2FA verification required" });
      return;
    }

    // Backward compat: old tokens only have { email }
    if (decoded.userId) {
      req.user = {
        userId: decoded.userId as string,
        email: decoded.email as string,
        role: decoded.role as string,
        privileges: (decoded.privileges as string[]) || [],
        displayName: decoded.displayName as string | undefined,
      };
    } else {
      // Legacy single-user token — treat as superadmin
      req.user = {
        userId: "legacy",
        email: decoded.email as string,
        role: "superadmin",
        privileges: [],
        displayName: undefined,
      };
    }

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}
