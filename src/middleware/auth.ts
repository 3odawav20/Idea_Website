import type { Request, Response, NextFunction } from "express";
import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "../lib/firebase-admin.ts";
import { getOrCreateUser, type DbUser } from "../db/users.ts";

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  dbUser?: DbUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing token" });
    return;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: "Unauthorized: Empty token" });
    return;
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.dbUser = await getOrCreateUser({
      uid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      emailVerified: Boolean(decoded.email_verified),
      provider: decoded.firebase?.sign_in_provider || "firebase",
    });
    next();
  } catch (error) {
    console.error("Error verifying Firebase ID token:", error);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    next();
    return;
  }
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.user = decoded;
    req.dbUser = await getOrCreateUser({
      uid: decoded.uid,
      email: decoded.email || null,
      phone: decoded.phone_number || null,
      name: typeof decoded.name === "string" ? decoded.name : null,
      emailVerified: Boolean(decoded.email_verified),
      provider: decoded.firebase?.sign_in_provider || "firebase",
    });
  } catch {
    // Ignore optional auth errors on public routes.
  }
  next();
};

export const requireRole =
  (...roles: string[]) =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.dbUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    if (!roles.includes(req.dbUser.role)) {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
      return;
    }
    next();
  };
