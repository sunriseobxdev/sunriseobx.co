import type { Request, Response, NextFunction } from "express";
import { hasPrivilege } from "../lib/iam.js";

export function requirePrivilege(...privileges: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const role = user.role || "superadmin";
    const extraPrivs = user.privileges || [];

    for (const priv of privileges) {
      if (!hasPrivilege(role, extraPrivs, priv)) {
        res.status(403).json({ error: "Forbidden: insufficient privileges" });
        return;
      }
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const userRole = user.role || "superadmin";

    if (!roles.includes(userRole)) {
      res.status(403).json({ error: "Forbidden: insufficient role" });
      return;
    }

    next();
  };
}
