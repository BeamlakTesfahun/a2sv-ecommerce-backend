import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../libs/jwt.js";

export interface AuthedRequest extends Request {
  user?: { userId: string; username: string; role: "USER" | "ADMIN" };
}

const BEARER_RE = /^Bearer\s+(.+)$/i;

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Response | void {
  const auth = req.headers.authorization;
  const token = auth ? auth.match(BEARER_RE)?.[1] : null;

  if (!token) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
}

export function requireAdmin(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
): Response | void {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
}
