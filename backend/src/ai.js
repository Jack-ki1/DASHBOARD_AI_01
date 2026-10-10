import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "./auth.js";
import { AiError, aiConfigured, chatJson, extractJson } from "./provider.js";

const WIDGET_DOC = `Widget JSON: {"type":"kpi|line|area|bar|donut|table|insight|funnel|sparkline|horizontal|stacked|radial|heatmap|radar","title":string,"metric":numeric column name (not for table/insight),"dimension":category column name (charts only),"agg":"sum|avg|count","w":grid span one of 3,4,6,8,12,"h":1 for kpi else 2,"color":0-4,"text":string (insight only)}.
Rules: use ONLY the given column names exactly. Rows should total 12 columns of span (e.g. four kpis of 3, then 8+4, then 6+6). Themes: light, ocean, midnight, sunset, forest, aurora, emerald, corporate, minimal, glass, neon, mono, royal, healthcare, finance, agriculture, iot.`;

const datasetChoice =
  "sales, finance, marketing, hr, healthcare, ecommerce, supply, energy, atlas, agriculture, iot, aimlops";

const generateSchema = z.object({
  prompt: z.string().min(2).max(2000),
  columns: z.array(z.string()).optional(),
  sample: z.string().max(4000).optional(),
});

const editSchema = z.object({
  instruction: z.string().min(2).max(1000),
  columns: z.array(z.string()),
  theme: z.string(),
  widgets: z.array(z.any()).max(40),
});

function notConfigured(res) {
  return res.status(503).json({
    ok: false,
    error: "AI_NOT_CONFIGURED",
    message:
      "No AI provider is configured on the server (AI_BASE_URL / AI_API_KEY / AI_MODEL). The app will use labeled demo generation instead.",
  });
}

async function run(res, system, user, emptyMessage) {
  try {
    const text = await chatJson(system, user);
    return res.json({ ok: true, data: extractJson(text) });
  } catch (e) {
    if (e instanceof AiError) {
      return res.status(e.status).json({ ok: false, error: "AI_FAILED", message: e.message });
    }
    if (e instanceof SyntaxError) {
      return res.status(502).json({ ok: false, error: "AI_BAD_JSON", message: emptyMessage });
    }
    return res
      .status(502)
      .json({ ok: false, error: "AI_FAILED", message: "The AI request failed. Please try again." });
  }
}

export const aiRouter = Router();

aiRouter.post("/generate", requireAuth, async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  if (!aiConfigured()) return notConfigured(res);
  const { prompt, columns, sample } = parsed.data;
  const dataPart = columns
    ? `The user's dataset has columns: ${columns.join(", ")}. Sample rows:\n${sample ?? ""}\nSet "dataset":"uploaded".`
    : `Pick the best built-in dataset for "dataset" from: ${datasetChoice}. Column names per dataset — sales: Month,Region,Product,Sales,Orders,Profit; finance: Month,Department,Revenue,Expenses,Margin; marketing: Month,Channel,Visitors,Leads,Spend; hr: Month,Team,Headcount,Hires,Attrition; healthcare: Month,Ward,Patients,Admissions,Wait Minutes; ecommerce: Month,Category,Revenue,Orders,Returns; supply: Month,Warehouse,Shipments,On Time,Cost; energy: Month,Source,Output MWh,Cost,Emissions; agriculture: Month,Crop,Yield t/ha,Rainfall mm,Soil Moisture %; iot: Month,District,Devices,Online,Energy MWh,Alerts; aimlops: Month,Model,Requests,Latency ms,Accuracy %,Errors.`;
  return run(
    res,
    `You are DASHBOARD AI, an expert analytics designer. Respond with ONLY a JSON object: {"name":string,"description":string,"theme":string,"dataset":string,"widgets":Widget[]}. Create 7-10 widgets including one insight widget with a concrete observation. ${WIDGET_DOC}`,
    `${dataPart}\n\nUser request: ${prompt}`,
    "The AI returned an empty dashboard. Try rephrasing your request.",
  );
});

aiRouter.post("/edit", requireAuth, async (req, res) => {
  const parsed = editSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  if (!aiConfigured()) return notConfigured(res);
  const { instruction, columns, theme, widgets } = parsed.data;
  return run(
    res,
    `You are the DASHBOARD AI Studio copilot. Apply the user's instruction to the dashboard. Respond with ONLY JSON: {"theme":string,"widgets":Widget[],"summary":string (one short sentence of what changed)}. Keep existing widget "id" fields when keeping a widget; omit id for new ones. ${WIDGET_DOC}`,
    `Columns: ${columns.join(", ")}\nCurrent theme: ${theme}\nCurrent widgets: ${JSON.stringify(widgets)}\n\nInstruction: ${instruction}`,
    "The copilot couldn't apply that. Please try again.",
  );
});
