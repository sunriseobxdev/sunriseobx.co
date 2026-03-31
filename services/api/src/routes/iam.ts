import { Router } from "express";
import bcrypt from "bcryptjs";
import { authMiddleware } from "../middleware/auth.js";
import { requirePrivilege } from "../middleware/rbac.js";
import { getPool } from "../lib/db.js";
import {
  ROLES,
  roleRank,
  canManageRole,
  getPrivilegesForRole,
} from "../lib/iam.js";

export const iamRouter = Router();

const PRIMARY_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@sprimage.com";

function getClientIp(req: import("express").Request): string | null {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.ip || null;
}

async function auditLog(
  userId: string | null,
  action: string,
  resource: string,
  details: Record<string, unknown>,
  ip: string | null
): Promise<void> {
  const pool = getPool();
  await pool.query(
    `INSERT INTO audit_log (user_id, action, resource, details, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, action, resource, JSON.stringify(details), ip]
  );
}

// All IAM routes require auth + manage_users privilege
iamRouter.use(authMiddleware, requirePrivilege("manage_users"));

// ── GET /iam/users — list all users ──
iamRouter.get("/users", async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, display_name, role, privileges, disabled, created_at, updated_at, last_login, created_by
       FROM users ORDER BY created_at ASC`
    );
    res.json(result.rows.map(formatUser));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("List users error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── POST /iam/users — create user ──
iamRouter.post("/users", async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body as {
      email?: string;
      password?: string;
      displayName?: string;
      role?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    if (!role || !ROLES.includes(role as (typeof ROLES)[number])) {
      res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
      return;
    }

    // Actor can't create a role equal or higher than their own
    const actorRole = req.user!.role;
    if (!canManageRole(actorRole, role)) {
      res
        .status(403)
        .json({ error: "Cannot create a user with equal or higher role" });
      return;
    }

    const pool = getPool();

    // Check for existing user
    const existing = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (existing.rows.length > 0) {
      res.status(409).json({ error: "A user with this email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const actorId = req.user!.userId !== "legacy" ? req.user!.userId : null;

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, role, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, display_name, role, privileges, disabled, created_at, updated_at, last_login, created_by`,
      [email, passwordHash, displayName || null, role, actorId]
    );

    const ip = getClientIp(req);
    await auditLog(actorId, "create_user", `users/${result.rows[0].id}`, {
      email,
      role,
    }, ip);

    res.status(201).json(formatUser(result.rows[0]));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Create user error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /iam/users/:id — get single user ──
iamRouter.get("/users/:id", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, display_name, role, privileges, disabled, created_at, updated_at, last_login, created_by
       FROM users WHERE id = $1`,
      [req.params.id as string]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json(formatUser(result.rows[0]));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Get user error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /iam/users/:id — update user ──
iamRouter.put("/users/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { role, displayName, disabled, privileges } = req.body as {
      role?: string;
      displayName?: string;
      disabled?: boolean;
      privileges?: string[];
    };

    // Fetch target user
    const target = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.params.id as string]
    );
    if (target.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const targetUser = target.rows[0];
    const actorRole = req.user!.role;

    // Can't modify someone of equal or higher rank (unless self)
    if (
      req.user!.userId !== targetUser.id &&
      !canManageRole(actorRole, targetUser.role)
    ) {
      res
        .status(403)
        .json({ error: "Cannot modify a user with equal or higher role" });
      return;
    }

    // Prevent disabling the primary superadmin
    if (disabled === true && targetUser.email === PRIMARY_ADMIN_EMAIL) {
      res
        .status(403)
        .json({ error: "Cannot disable the primary superadmin account" });
      return;
    }

    // If changing role, validate
    if (role !== undefined) {
      if (!ROLES.includes(role as (typeof ROLES)[number])) {
        res
          .status(400)
          .json({ error: `role must be one of: ${ROLES.join(", ")}` });
        return;
      }
      // Can't promote beyond own rank
      if (!canManageRole(actorRole, role)) {
        res
          .status(403)
          .json({ error: "Cannot assign a role equal or higher than your own" });
        return;
      }
    }

    // Build update fields
    const setClauses: string[] = ["updated_at = NOW()"];
    const values: unknown[] = [];
    let paramIdx = 1;

    if (role !== undefined) {
      setClauses.push(`role = $${paramIdx++}`);
      values.push(role);
    }
    if (displayName !== undefined) {
      setClauses.push(`display_name = $${paramIdx++}`);
      values.push(displayName);
    }
    if (disabled !== undefined) {
      setClauses.push(`disabled = $${paramIdx++}`);
      values.push(disabled);
    }
    if (privileges !== undefined) {
      setClauses.push(`privileges = $${paramIdx++}`);
      values.push(JSON.stringify(privileges));
    }

    values.push(req.params.id as string);

    const result = await pool.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = $${paramIdx}
       RETURNING id, email, display_name, role, privileges, disabled, created_at, updated_at, last_login, created_by`,
      values
    );

    const ip = getClientIp(req);
    const actorId = req.user!.userId !== "legacy" ? req.user!.userId : null;
    await auditLog(actorId, "update_user", `users/${req.params.id as string}`, {
      changes: { role, displayName, disabled, privileges },
    }, ip);

    res.json(formatUser(result.rows[0]));
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Update user error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── DELETE /iam/users/:id — soft delete (disable) ──
iamRouter.delete("/users/:id", async (req, res) => {
  try {
    const pool = getPool();

    const target = await pool.query(
      "SELECT id, email, role FROM users WHERE id = $1",
      [req.params.id as string]
    );
    if (target.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const targetUser = target.rows[0];

    // Can't delete the primary superadmin
    if (targetUser.email === PRIMARY_ADMIN_EMAIL) {
      res.status(403).json({ error: "Cannot delete the primary superadmin" });
      return;
    }

    const actorRole = req.user!.role;
    if (!canManageRole(actorRole, targetUser.role)) {
      res
        .status(403)
        .json({ error: "Cannot delete a user with equal or higher role" });
      return;
    }

    await pool.query(
      "UPDATE users SET disabled = true, updated_at = NOW() WHERE id = $1",
      [req.params.id as string]
    );

    // Revoke all sessions
    await pool.query(
      "UPDATE sessions SET revoked = true WHERE user_id = $1",
      [req.params.id as string]
    );

    const ip = getClientIp(req);
    const actorId = req.user!.userId !== "legacy" ? req.user!.userId : null;
    await auditLog(actorId, "delete_user", `users/${req.params.id as string}`, {
      email: targetUser.email,
    }, ip);

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Delete user error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── PUT /iam/users/:id/password — change password ──
iamRouter.put("/users/:id/password", async (req, res) => {
  try {
    const pool = getPool();
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!newPassword || newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "newPassword is required and must be at least 8 characters" });
      return;
    }

    const target = await pool.query(
      "SELECT id, email, role, password_hash FROM users WHERE id = $1",
      [req.params.id as string]
    );
    if (target.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const targetUser = target.rows[0];
    const isSelf = req.user!.userId === targetUser.id;
    const actorRole = req.user!.role;

    if (isSelf) {
      // Self-service: must provide current password
      if (!currentPassword) {
        res
          .status(400)
          .json({ error: "currentPassword is required for self-service password change" });
        return;
      }
      const valid = await bcrypt.compare(currentPassword, targetUser.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }
    } else {
      // Admin override: actor must outrank target
      if (!canManageRole(actorRole, targetUser.role)) {
        res
          .status(403)
          .json({ error: "Cannot change password of a user with equal or higher role" });
        return;
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2",
      [passwordHash, req.params.id as string]
    );

    // Revoke all sessions for the target user
    await pool.query(
      "UPDATE sessions SET revoked = true WHERE user_id = $1",
      [req.params.id as string]
    );

    const ip = getClientIp(req);
    const actorId = req.user!.userId !== "legacy" ? req.user!.userId : null;
    await auditLog(
      actorId,
      "change_password",
      `users/${req.params.id as string}`,
      { targetEmail: targetUser.email, selfService: isSelf },
      ip
    );

    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Change password error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /iam/audit — list audit log ──
iamRouter.get("/audit", async (req, res) => {
  try {
    const pool = getPool();
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 500);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const result = await pool.query(
      `SELECT al.id, al.user_id, u.email as user_email, al.action, al.resource, al.details, al.ip_address, al.created_at
       FROM audit_log al
       LEFT JOIN users u ON al.user_id = u.id
       ORDER BY al.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query("SELECT COUNT(*) FROM audit_log");
    const total = parseInt(countResult.rows[0].count, 10);

    res.json({
      items: result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        action: row.action,
        resource: row.resource,
        details: row.details,
        ipAddress: row.ip_address,
        createdAt: row.created_at,
      })),
      total,
      limit,
      offset,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("List audit error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── GET /iam/sessions — list active sessions ──
iamRouter.get("/sessions", async (_req, res) => {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT s.id, s.user_id, u.email as user_email, s.ip_address, s.user_agent, s.created_at, s.expires_at, s.revoked
       FROM sessions s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.revoked = false AND s.expires_at > NOW()
       ORDER BY s.created_at DESC
       LIMIT 200`
    );

    res.json(
      result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userEmail: row.user_email,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
        expiresAt: row.expires_at,
      }))
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("List sessions error:", message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ── Helpers ──

function formatUser(row: Record<string, unknown>) {
  const rolePrivileges = getPrivilegesForRole(row.role as string);
  const extraPrivs: string[] = (row.privileges as string[]) || [];
  const allPrivileges = [...new Set([...rolePrivileges, ...extraPrivs])];

  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    privileges: allPrivileges,
    disabled: row.disabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastLogin: row.last_login,
    createdBy: row.created_by,
  };
}
