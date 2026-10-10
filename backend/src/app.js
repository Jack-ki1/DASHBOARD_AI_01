import express from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { authRouter } from "./auth.js";
import { dashboardsRouter } from "./dashboards.js";
import { aiRouter } from "./ai.js";
import { aiConfigured } from "./provider.js";

const here = dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  const origins = (process.env.CORS_ORIGIN ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.use(cors({ origin: origins }));
  app.use(express.json({ limit: "5mb" }));

  app.get("/api/health", (req, res) => {
    res.json({ ok: true, data: { ai: aiConfigured() ? "live" : "demo", version: "1.0.0" } });
  });
  app.use("/api/auth", authRouter);
  app.use("/api/dashboards", dashboardsRouter);
  app.use("/api/ai", aiRouter);

  // Serve the production frontend build when present (single-port deploy).
  const dist = resolve(
    process.env.FRONTEND_DIST ?? new URL("../../frontend/dist", import.meta.url).pathname,
  );
  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api/")) return next();
      res.sendFile(resolve(dist, "index.html"));
    });
  }

  app.use("/api", (req, res) => res.status(404).json({ ok: false, error: "NOT_FOUND" }));
  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ ok: false, error: "INTERNAL" });
  });
  return { app, dist: existsSync(dist) ? dist : null, here };
}
