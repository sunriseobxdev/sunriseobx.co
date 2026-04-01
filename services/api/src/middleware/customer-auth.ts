import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPool } from "../lib/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export interface CustomerPayload {
  customerId: string;
  email: string;
  type: "customer";
}

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerPayload;
    }
  }
}

export function customerAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as CustomerPayload;
    if (payload.type !== "customer") {
      res.status(401).json({ error: "Invalid token type" });
      return;
    }
    req.customer = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function signCustomerToken(customerId: string, email: string): string {
  return jwt.sign(
    { customerId, email, type: "customer" } as CustomerPayload,
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
