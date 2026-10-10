import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "./auth.js";
import { deleteDashboard, getDashboard, listDashboards, saveDashboard } from "./db.js";

const widgetSchema = z.object({}).passthrough();
const datasetSchema = z.object({
  name: z.string(),
  columns: z.array(z.string()),
  rows: z.array(z.record(z.union([z.string(), z.number()]))),
});
const dashboardSchema = z.object({
  id: z.string().min(1).max(100).optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  theme: z.string().min(1).max(40),
  design: z.string().max(40).optional(),
  designVersion: z.number().optional(),
  widgets: z.array(widgetSchema).max(60),
  dataset: datasetSchema,
  filters: z.record(z.union([z.string(), z.number()])),
  published: z.boolean().optional(),
  favorite: z.boolean().optional(),
  archived: z.boolean().optional(),
  versions: z.array(z.object({}).passthrough()).max(20).optional(),
});

export const dashboardsRouter = Router();

dashboardsRouter.get("/", requireAuth, (req, res) => {
  return res.json({ ok: true, data: listDashboards(req.user.id) });
});

dashboardsRouter.post("/", requireAuth, (req, res) => {
  const parsed = dashboardSchema.safeParse(req.body?.dashboard ?? req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_DASHBOARD" });
  }
  const { dashboard, created } = saveDashboard(req.user.id, parsed.data);
  return res.status(created ? 201 : 200).json({ ok: true, data: dashboard });
});

dashboardsRouter.put("/:id", requireAuth, (req, res) => {
  const parsed = dashboardSchema.safeParse({
    ...req.body?.dashboard,
    ...req.body,
    id: req.params.id,
  });
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "INVALID_DASHBOARD" });
  }
  const result = saveDashboard(req.user.id, parsed.data);
  if (result.conflict) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  return res.json({ ok: true, data: result.dashboard });
});

dashboardsRouter.get("/:id", requireAuth, (req, res) => {
  const found = getDashboard(req.params.id, req.user.id);
  if (!found) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  return res.json({ ok: true, data: found.dashboard });
});

dashboardsRouter.delete("/:id", requireAuth, (req, res) => {
  const deleted = deleteDashboard(req.params.id, req.user.id);
  if (!deleted) return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  return res.json({ ok: true, data: { id: req.params.id } });
});

/** Public read of a published dashboard — powers share links without an account. */
dashboardsRouter.get("/shared/:id", (req, res) => {
  const found = getDashboard(req.params.id);
  if (!found || !found.dashboard.published) {
    return res.status(404).json({ ok: false, error: "NOT_FOUND" });
  }
  return res.json({ ok: true, data: found.dashboard });
});
