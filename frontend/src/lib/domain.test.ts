import { describe, expect, it } from "vitest";

import {
  DATASETS,
  TEMPLATES,
  aggregate,
  applyFilters,
  autoWidgets,
  categoryColumns,
  dashboardFromTemplate,
  differentiateDashboard,
  groupBy,
  numericColumns,
  parseCSV,
  parseJSON,
} from "./dashboard";
import { designWidgets, isLegacyDesignLayout } from "./report-designs";
import { sanitizeTheme, sanitizeWidgets } from "./sanitize";
import { computeInsights } from "./insights";
import { demoEdit, demoGenerate } from "./demo-generate";

const rows = [
  { Month: "Jan", Region: "EMEA", Sales: 100, Orders: 5 },
  { Month: "Feb", Region: "EMEA", Sales: 200, Orders: 9 },
  { Month: "Feb", Region: "APAC", Sales: 300, Orders: 12 },
];

describe("analytics", () => {
  it("aggregates sum/avg/count", () => {
    expect(aggregate(rows, "Sales", "sum")).toBe(600);
    expect(aggregate(rows, "Sales", "avg")).toBe(200);
    expect(aggregate(rows, "Sales", "count")).toBe(3);
  });
  it("groups by dimension", () => {
    expect(groupBy(rows, "Region", "Sales", "sum")).toEqual([
      { name: "EMEA", value: 300 },
      { name: "APAC", value: 300 },
    ]);
  });
  it("detects column kinds and filters rows", () => {
    const ds = { name: "t", columns: ["Month", "Region", "Sales"], rows };
    expect(numericColumns(ds)).toEqual(["Sales"]);
    expect(categoryColumns(ds)).toEqual(["Month", "Region"]);
    expect(applyFilters(ds, { Region: "APAC" })).toHaveLength(1);
    expect(applyFilters(ds, {})).toHaveLength(3);
  });
});

describe("import parsing", () => {
  it("parses CSV with numbers and quoted commas", () => {
    const ds = parseCSV('Month,Note,Sales\nJan,"hello, world",100\nFeb,plain,200', "csv");
    expect(ds.columns).toEqual(["Month", "Note", "Sales"]);
    expect(ds.rows[0]).toMatchObject({ Month: "Jan", Note: "hello, world", Sales: 100 });
  });
  it("parses a JSON array and {rows} wrapper", () => {
    const a = parseJSON('[{"Month":"Jan","Sales":120}]', "j");
    expect(a.columns).toEqual(["Month", "Sales"]);
    expect(a.rows[0]).toMatchObject({ Sales: 120 });
    const b = parseJSON('{"rows":[{"Month":"Jan","Sales":1}]}', "j");
    expect(b.rows).toHaveLength(1);
  });
  it("rejects non-tabular JSON with a readable error", () => {
    expect(() => parseJSON('{"a":1}', "j")).toThrow(/array of objects/);
    expect(() => parseJSON("nope", "j")).toThrow(/valid JSON/);
  });
});

describe("dashboard building blocks", () => {
  it("autoWidgets covers kpis, trend, breakdown and table", () => {
    const ds = { name: "t", columns: ["Month", "Region", "Sales", "Orders"], rows };
    const ws = autoWidgets(ds);
    expect(ws.map((w) => w.type)).toEqual(
      expect.arrayContaining(["kpi", "area", "donut", "bar", "table"]),
    );
    for (const w of ws) expect([3, 4, 6, 8, 12]).toContain(w.w);
  });
  it("every template loads to an editable config with real bindings", () => {
    expect(TEMPLATES.length).toBeGreaterThanOrEqual(12);
    for (const t of TEMPLATES) {
      const d = dashboardFromTemplate(t);
      expect(d.widgets.length).toBeGreaterThan(0);
      for (const w of d.widgets) {
        if (w.metric) expect(d.dataset.columns).toContain(w.metric);
      }
    }
  });
  it("new industry designs build widgets", () => {
    for (const key of ["agriculture", "iot", "aimlops"] as const) {
      const ds = DATASETS[key]();
      for (const design of ["harvest", "sentinel", "models"] as const) {
        const ws = designWidgets(design, ds, () => "id");
        expect(ws.length).toBeGreaterThan(4);
      }
    }
  });
  it("legacy upgrade only touches exact unedited layouts", () => {
    const tpl = TEMPLATES.find((t) => t.design === "harvest")!;
    const fresh = { ...dashboardFromTemplate(tpl), designVersion: undefined };
    const upgraded = differentiateDashboard({ ...fresh });
    expect(upgraded.designVersion).toBe(2);
    const edited = {
      ...fresh,
      widgets: fresh.widgets.map((w, i) => (i === 0 ? { ...w, title: "Mine" } : w)),
    };
    expect(differentiateDashboard(edited).widgets[0].title).toBe("Mine");
    expect(isLegacyDesignLayout("harvest", fresh.widgets)).toBe(true);
    expect(isLegacyDesignLayout("harvest", edited.widgets)).toBe(false);
  });
});

describe("sanitize", () => {
  it("falls back to a safe theme", () => {
    expect(sanitizeTheme("midnight")).toBe("midnight");
    expect(sanitizeTheme("neon")).toBe("neon");
    expect(sanitizeTheme("nope")).toBe("light");
  });
  it("drops bad widgets, fixes bindings, keeps format", () => {
    const ds = { name: "t", columns: ["Month", "Sales"], rows };
    const ws = sanitizeWidgets(
      [
        { type: "bar", title: "A", metric: "Sales", dimension: "Month", w: 6, h: 2 },
        { type: "bogus", title: "B" },
        { type: "kpi", title: "C", metric: "Missing", w: 99, format: "currency" },
        { type: "heatmap", title: "D", metric: "Sales", dimension: "Month" },
      ],
      ds,
    );
    expect(ws.map((w) => w.type)).toEqual(["bar", "kpi", "heatmap"]);
    expect(ws[1]?.metric).toBe("Sales");
    expect(ws[1]?.format).toBe("currency");
  });
});

describe("insights + demo generation", () => {
  it("computes grounded statements from real rows", () => {
    const ds = DATASETS.sales();
    const list = computeInsights(ds);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]?.text).toContain(list[0]?.metric ?? "");
  });
  it("demoGenerate matches industry keywords and labels demo output", () => {
    const { dashboard, demo } = demoGenerate("hospital patient wait times dark mode", null);
    expect(demo).toBe(true);
    expect(dashboard.dataset.name).toContain("Hospital");
    expect(dashboard.theme).toBe("midnight");
    expect(dashboard.description).toMatch(/demo/i);
    expect(dashboard.widgets.some((w) => w.type === "insight")).toBe(true);
  });
  it("demoEdit applies local ops and rejects unknown ones", () => {
    const base = dashboardFromTemplate(TEMPLATES[0]);
    expect(demoEdit("switch to dark theme", base)?.dashboard.theme).toBe("midnight");
    expect(demoEdit("simplify this", base)?.dashboard.widgets.length).toBeLessThanOrEqual(6);
    expect(demoEdit("add an insight", base)?.summary).toMatch(/computed/);
    expect(demoEdit("add a KPI", base)?.dashboard.widgets.at(-1)?.type).toBe("kpi");
    expect(demoEdit("launch the rocket", base)).toBeNull();
  });
});
