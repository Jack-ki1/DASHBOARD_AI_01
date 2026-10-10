import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { createUser, findUserByEmail } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
if (!JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production.");
}
if (!JWT_SECRET) {
  console.warn(
    "[auth] JWT_SECRET is not set — using an insecure development default. Set JWT_SECRET for any shared deployment.",
  );
}
const SECRET = JWT_SECRET || "dev-only-insecure-secret-change-me";

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** Attaches req.user ({id, email}) or responds 401. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  try {
    const payload = jwt.verify(token, SECRET);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: "UNAUTHORIZED" });
  }
}

const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200),
});

export const authRouter = Router();

authRouter.post("/register", (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_CREDENTIALS" });
  }
  const { email, password } = parsed.data;
  if (findUserByEmail(email)) {
    return res.status(409).json({
      ok: false,
      error: "EMAIL_TAKEN",
      message: "An account with that email already exists.",
    });
  }
  const user = createUser(email, bcrypt.hashSync(password, 10));
  return res.status(201).json({ ok: true, data: { token: signToken(user), user } });
});

authRouter.post("/login", (req, res) => {
  const parsed = credentials.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_CREDENTIALS" });
  }
  const { email, password } = parsed.data;
  const row = findUserByEmail(email);
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return res
      .status(401)
      .json({ ok: false, error: "INVALID_LOGIN", message: "Invalid email or password." });
  }
  const user = { id: row.id, email: row.email };
  return res.json({ ok: true, data: { token: signToken(user), user } });
});

authRouter.get("/me", requireAuth, (req, res) => {
  return res.json({ ok: true, data: { user: req.user } });
});
