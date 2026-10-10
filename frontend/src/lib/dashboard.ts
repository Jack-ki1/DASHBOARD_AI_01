import {
  designWidgets,
  DESIGN_VERSION,
  isLegacyDesignLayout,
  type ReportDesign,
} from "./report-designs";
import {
  atlasData,
  clinicalData,
  commerceData,
  energyData,
  financeData,
  logisticsData,
  marketingData,
  peopleData,
  salesData,
  agriData,
  iotData,
  aimlData,
} from "./demo-data";

export type Cell = string | number;
export type Row = Record<string, Cell>;
export type Dataset = { name: string; columns: string[]; rows: Row[] };

export type WidgetType =
  | "kpi"
  | "line"
  | "area"
  | "bar"
  | "donut"
  | "table"
  | "insight"
  | "funnel"
  | "sparkline"
  | "horizontal"
  | "stacked"
  | "radial"
  | "heatmap"
  | "radar"
  | "combo"
  | "waterfall"
  | "bullet"
  | "treemap"
  | "gauge"
  | "cohort"
  | "histogram"
  | "bubble"
  | "slope"
  | "status"
  | "tilemap"
  | "leaderboard"
  | "mirror"
  | "statement"
  | "roster"
  | "hero"
  | "stackedarea"
  | "stages";
export type Agg = "sum" | "avg" | "count";

export type Widget = {
  id: string;
  type: WidgetType;
  title: string;
  metric?: string;
  dimension?: string;
  agg?: Agg;
  w: number; // grid span out of 12
  h: number; // row units
  color?: number; // chart palette index
  text?: string; // insight body
  metric2?: string; // target, comparison, or secondary series
  metrics?: string[]; // ordered stages (funnel, waterfall, statement)
  series?: string; // breakdown category
  page?: string; // report page tab
  variant?: string; // design-specific presentation
  format?: "currency" | "percent" | "number" | "minutes" | "rating";
};

export type ThemeId =
  | "light"
  | "ocean"
  | "midnight"
  | "sunset"
  | "forest"
  | "aurora"
  | "emerald"
  | "corporate"
  | "minimal"
  | "glass"
  | "neon"
  | "mono"
  | "royal"
  | "healthcare"
  | "finance"
  | "agriculture"
  | "iot";

export type Dashboard = {
  id: string;
  name: string;
  description?: string;
  theme: ThemeId;
  design?: ReportDesign;
  designVersion?: number;
  widgets: Widget[];
  dataset: Dataset;
  filters: Record<string, Cell>;
  published?: boolean;
  favorite?: boolean;
  archived?: boolean;
  updatedAt: number;
  versions?: { at: number; label: string; widgets: Widget[]; theme: ThemeId }[];
};

export const THEMES: Record<
  ThemeId,
  {
    label: string;
    bg: string;
    card: string;
    fg: string;
    muted: string;
    border: string;
    palette: string[];
  }
> = {
  light: {
    label: "Light",
    bg: "oklch(0.975 0.008 255)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.22 0.04 265)",
    muted: "oklch(0.55 0.03 262)",
    border: "oklch(0.92 0.015 260)",
    palette: [
      "oklch(0.56 0.22 262)",
      "oklch(0.72 0.14 215)",
      "oklch(0.7 0.17 160)",
      "oklch(0.78 0.15 75)",
      "oklch(0.65 0.2 15)",
    ],
  },
  ocean: {
    label: "Ocean",
    bg: "oklch(0.96 0.025 225)",
    card: "oklch(0.995 0.005 225)",
    fg: "oklch(0.25 0.06 240)",
    muted: "oklch(0.52 0.05 230)",
    border: "oklch(0.9 0.03 225)",
    palette: [
      "oklch(0.58 0.15 230)",
      "oklch(0.75 0.12 195)",
      "oklch(0.45 0.12 250)",
      "oklch(0.82 0.1 170)",
      "oklch(0.68 0.13 210)",
    ],
  },
  midnight: {
    label: "Midnight",
    bg: "oklch(0.17 0.03 265)",
    card: "oklch(0.22 0.04 265)",
    fg: "oklch(0.96 0.01 260)",
    muted: "oklch(0.68 0.03 260)",
    border: "oklch(0.3 0.04 265)",
    palette: [
      "oklch(0.68 0.19 262)",
      "oklch(0.78 0.14 200)",
      "oklch(0.75 0.17 160)",
      "oklch(0.82 0.15 80)",
      "oklch(0.7 0.2 350)",
    ],
  },
  sunset: {
    label: "Sunset",
    bg: "oklch(0.97 0.015 50)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.25 0.05 30)",
    muted: "oklch(0.55 0.05 40)",
    border: "oklch(0.92 0.02 50)",
    palette: [
      "oklch(0.65 0.2 30)",
      "oklch(0.75 0.16 60)",
      "oklch(0.6 0.2 0)",
      "oklch(0.82 0.14 85)",
      "oklch(0.55 0.15 330)",
    ],
  },
  forest: {
    label: "Forest",
    bg: "oklch(0.2 0.03 160)",
    card: "oklch(0.25 0.04 160)",
    fg: "oklch(0.95 0.02 150)",
    muted: "oklch(0.7 0.04 150)",
    border: "oklch(0.33 0.04 160)",
    palette: [
      "oklch(0.75 0.17 155)",
      "oklch(0.82 0.15 120)",
      "oklch(0.7 0.12 190)",
      "oklch(0.85 0.13 90)",
      "oklch(0.65 0.15 220)",
    ],
  },
  aurora: {
    label: "Aurora",
    bg: "oklch(0.96 0.03 300)",
    card: "oklch(0.995 0.005 300)",
    fg: "oklch(0.24 0.06 300)",
    muted: "oklch(0.52 0.05 300)",
    border: "oklch(0.9 0.03 300)",
    palette: [
      "oklch(0.6 0.2 300)",
      "oklch(0.7 0.16 190)",
      "oklch(0.68 0.19 340)",
      "oklch(0.78 0.14 90)",
      "oklch(0.62 0.18 260)",
    ],
  },
  emerald: {
    label: "Emerald",
    bg: "oklch(0.95 0.03 165)",
    card: "oklch(0.995 0.005 165)",
    fg: "oklch(0.22 0.05 165)",
    muted: "oklch(0.5 0.05 160)",
    border: "oklch(0.89 0.03 165)",
    palette: [
      "oklch(0.55 0.16 165)",
      "oklch(0.7 0.14 140)",
      "oklch(0.6 0.13 200)",
      "oklch(0.8 0.13 100)",
      "oklch(0.5 0.12 230)",
    ],
  },
  corporate: {
    label: "Corporate",
    bg: "oklch(0.96 0.008 250)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.24 0.04 255)",
    muted: "oklch(0.53 0.03 250)",
    border: "oklch(0.9 0.015 250)",
    palette: [
      "oklch(0.5 0.14 255)",
      "oklch(0.6 0.1 230)",
      "oklch(0.55 0.08 280)",
      "oklch(0.7 0.08 210)",
      "oklch(0.45 0.1 260)",
    ],
  },
  minimal: {
    label: "Minimal",
    bg: "oklch(0.985 0.003 0)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.25 0.01 0)",
    muted: "oklch(0.58 0.01 0)",
    border: "oklch(0.93 0.005 0)",
    palette: [
      "oklch(0.45 0.02 250)",
      "oklch(0.6 0.02 250)",
      "oklch(0.7 0.02 250)",
      "oklch(0.78 0.02 250)",
      "oklch(0.55 0.03 200)",
    ],
  },
  glass: {
    label: "Glass",
    bg: "oklch(0.94 0.03 240)",
    card: "oklch(0.99 0.01 240)",
    fg: "oklch(0.24 0.05 250)",
    muted: "oklch(0.52 0.04 245)",
    border: "oklch(0.88 0.03 240)",
    palette: [
      "oklch(0.62 0.17 240)",
      "oklch(0.72 0.14 200)",
      "oklch(0.66 0.16 300)",
      "oklch(0.78 0.12 170)",
      "oklch(0.7 0.15 20)",
    ],
  },
  neon: {
    label: "Neon",
    bg: "oklch(0.15 0.03 290)",
    card: "oklch(0.2 0.04 290)",
    fg: "oklch(0.95 0.02 290)",
    muted: "oklch(0.68 0.04 290)",
    border: "oklch(0.3 0.05 290)",
    palette: [
      "oklch(0.75 0.25 330)",
      "oklch(0.8 0.2 190)",
      "oklch(0.78 0.22 130)",
      "oklch(0.82 0.2 70)",
      "oklch(0.7 0.24 280)",
    ],
  },
  mono: {
    label: "Monochrome",
    bg: "oklch(0.97 0 0)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.2 0 0)",
    muted: "oklch(0.55 0 0)",
    border: "oklch(0.9 0 0)",
    palette: [
      "oklch(0.3 0 0)",
      "oklch(0.45 0 0)",
      "oklch(0.6 0 0)",
      "oklch(0.72 0 0)",
      "oklch(0.82 0 0)",
    ],
  },
  royal: {
    label: "Royal",
    bg: "oklch(0.18 0.04 280)",
    card: "oklch(0.24 0.05 280)",
    fg: "oklch(0.95 0.02 280)",
    muted: "oklch(0.68 0.04 280)",
    border: "oklch(0.32 0.05 280)",
    palette: [
      "oklch(0.68 0.2 285)",
      "oklch(0.78 0.14 220)",
      "oklch(0.72 0.18 340)",
      "oklch(0.82 0.13 90)",
      "oklch(0.62 0.16 250)",
    ],
  },
  healthcare: {
    label: "Healthcare",
    bg: "oklch(0.96 0.02 190)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.24 0.05 200)",
    muted: "oklch(0.52 0.04 195)",
    border: "oklch(0.9 0.02 190)",
    palette: [
      "oklch(0.6 0.14 200)",
      "oklch(0.72 0.13 170)",
      "oklch(0.65 0.15 240)",
      "oklch(0.8 0.12 100)",
      "oklch(0.62 0.16 340)",
    ],
  },
  finance: {
    label: "Finance",
    bg: "oklch(0.95 0.015 90)",
    card: "oklch(1 0 0)",
    fg: "oklch(0.24 0.04 80)",
    muted: "oklch(0.53 0.04 85)",
    border: "oklch(0.9 0.02 90)",
    palette: [
      "oklch(0.55 0.13 90)",
      "oklch(0.6 0.12 150)",
      "oklch(0.58 0.14 40)",
      "oklch(0.75 0.12 110)",
      "oklch(0.5 0.1 220)",
    ],
  },
  agriculture: {
    label: "Agriculture",
    bg: "oklch(0.96 0.03 130)",
    card: "oklch(0.995 0.008 130)",
    fg: "oklch(0.24 0.05 140)",
    muted: "oklch(0.5 0.05 135)",
    border: "oklch(0.9 0.03 130)",
    palette: [
      "oklch(0.58 0.16 145)",
      "oklch(0.72 0.15 110)",
      "oklch(0.62 0.12 200)",
      "oklch(0.78 0.14 80)",
      "oklch(0.6 0.14 40)",
    ],
  },
  iot: {
    label: "IoT City",
    bg: "oklch(0.16 0.03 230)",
    card: "oklch(0.21 0.04 230)",
    fg: "oklch(0.95 0.015 230)",
    muted: "oklch(0.66 0.03 230)",
    border: "oklch(0.3 0.04 230)",
    palette: [
      "oklch(0.72 0.16 200)",
      "oklch(0.78 0.15 160)",
      "oklch(0.68 0.18 280)",
      "oklch(0.8 0.14 90)",
      "oklch(0.66 0.18 20)",
    ],
  },
};

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

// ---------- Sample data (deterministic) ----------
function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 9301 + 49297) % 233280) / 233280;
}
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function salesDataset(): Dataset {
  const r = seeded(7);
  const regions = ["North America", "Europe", "Asia", "LATAM"];
  const products = ["Laptop", "Phone", "Tablet", "Monitor"];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    regions.forEach((reg) =>
      products.forEach((p) => {
        const sales = Math.round(2000 + r() * 6000 + i * 180);
        rows.push({
          Month: m,
          Region: reg,
          Product: p,
          Sales: sales,
          Orders: Math.round(sales / (60 + r() * 40)),
          Profit: Math.round(sales * (0.15 + r() * 0.2)),
        });
      }),
    ),
  );
  return {
    name: "Sales 2026",
    columns: ["Month", "Region", "Product", "Sales", "Orders", "Profit"],
    rows,
  };
}

function genericDataset(
  name: string,
  dims: [string, string[]],
  cat: [string, string[]],
  metrics: string[],
  seed: number,
): Dataset {
  const r = seeded(seed);
  const rows: Row[] = [];
  dims[1].forEach((d, i) =>
    cat[1].forEach((c) => {
      const row: Row = { [dims[0]]: d, [cat[0]]: c };
      metrics.forEach((m, k) => (row[m] = Math.round((100 + r() * 900 + i * 25) * (k + 1))));
      rows.push(row);
    }),
  );
  return { name, columns: [dims[0], cat[0], ...metrics], rows };
}

export const DATASETS: Record<string, () => Dataset> = {
  sales: salesData,
  finance: financeData,
  marketing: marketingData,
  hr: peopleData,
  healthcare: clinicalData,
  ecommerce: commerceData,
  supply: logisticsData,
  energy: energyData,
  atlas: atlasData,
  agriculture: agriData,
  iot: iotData,
  aimlops: aimlData,
};
const LEGACY_DATASET_NAMES = [
  "Sales 2026",
  "Finance",
  "Marketing",
  "People",
  "Healthcare",
  "E‑commerce",
  "Supply Chain",
  "Energy",
];

// ---------- Analytics ----------
export function numericColumns(ds: Dataset) {
  return ds.columns.filter((c) => ds.rows.some((r) => typeof r[c] === "number"));
}
export function categoryColumns(ds: Dataset) {
  return ds.columns.filter((c) => !numericColumns(ds).includes(c));
}
export function applyFilters(ds: Dataset, filters: Record<string, Cell>) {
  const keys = Object.keys(filters);
  if (!keys.length) return ds.rows;
  return ds.rows.filter((r) => keys.every((k) => r[k] === filters[k]));
}
export function aggregate(rows: Row[], metric: string, agg: Agg = "sum") {
  if (agg === "count") return rows.length;
  const vals = rows.map((r) => Number(r[metric]) || 0);
  const s = vals.reduce((a, b) => a + b, 0);
  return agg === "avg" ? (vals.length ? s / vals.length : 0) : s;
}
export function groupBy(rows: Row[], dim: string, metric: string, agg: Agg = "sum") {
  const map = new Map<string, Row[]>();
  rows.forEach((r) => {
    const k = String(r[dim]);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(r);
  });
  return [...map.entries()].map(([name, rs]) => ({
    name,
    value: Math.round(aggregate(rs, metric, agg)),
  }));
}
export function fmt(n: number) {
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(2) + "M";
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + "K";
  return Math.round(n).toLocaleString();
}

export function parseCSV(text: string, name = "Uploaded data"): Dataset {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  const split = (l: string) =>
    l
      .match(/("([^"]|"")*"|[^,]*)(,|$)/g)!
      .slice(0, -1)
      .map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim());
  const columns = split(lines[0]);
  const rows = lines.slice(1, 2001).map((l) => {
    const cells = split(l);
    const row: Row = {};
    columns.forEach((c, i) => {
      const v = cells[i] ?? "";
      const n = Number(v.replace(/[$,%]/g, ""));
      row[c] = v !== "" && !Number.isNaN(n) ? n : v;
    });
    return row;
  });
  return { name, columns, rows };
}

/** Parses a JSON array of flat objects into a Dataset. Throws with a readable message. */
export function parseJSON(text: string, name = "Uploaded data"): Dataset {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }
  const arr = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { rows?: unknown }).rows)
      ? (raw as { rows: unknown[] }).rows
      : Array.isArray((raw as { data?: unknown }).data)
        ? (raw as { data: unknown[] }).data
        : null;
  if (!arr?.length || typeof arr[0] !== "object" || arr[0] === null) {
    throw new Error('Expected a JSON array of objects, e.g. [{"Month": "Jan", "Sales": 120}].');
  }
  const columns = [...new Set(arr.flatMap((r) => Object.keys(r as Record<string, unknown>)))].slice(
    0,
    30,
  );
  if (!columns.length) throw new Error("No columns found in that JSON file.");
  const rows: Row[] = arr.slice(0, 2000).map((item) => {
    const src = item as Record<string, unknown>;
    const row: Row = {};
    columns.forEach((c) => {
      const v = src[c];
      if (typeof v === "number" && Number.isFinite(v)) row[c] = v;
      else if (typeof v === "string") {
        const n = Number(v.replace(/[$,%]/g, ""));
        row[c] = v !== "" && !Number.isNaN(n) ? n : v;
      } else if (v == null) row[c] = "";
      else row[c] = String(v);
    });
    return row;
  });
  return { name, columns, rows };
}

/** Builds a sensible dashboard from any dataset, no AI required. */
export function autoWidgets(ds: Dataset): Widget[] {
  const nums = numericColumns(ds);
  const cats = categoryColumns(ds);
  const time = cats.find((c) => /month|date|year|week|day|quarter/i.test(c)) ?? cats[0];
  const cat = cats.find((c) => c !== time) ?? cats[0];
  const ws: Widget[] = nums.slice(0, 4).map((m, i) => ({
    id: uid(),
    type: "kpi",
    title: `Total ${m}`,
    metric: m,
    agg: "sum",
    w: 3,
    h: 1,
    color: i,
  }));
  if (nums[0] && time)
    ws.push({
      id: uid(),
      type: "area",
      title: `${nums[0]} trend`,
      metric: nums[0],
      dimension: time,
      agg: "sum",
      w: 8,
      h: 2,
      color: 0,
    });
  if (nums[0] && cat)
    ws.push({
      id: uid(),
      type: "donut",
      title: `${nums[0]} by ${cat}`,
      metric: nums[0],
      dimension: cat,
      agg: "sum",
      w: 4,
      h: 2,
      color: 1,
    });
  if (nums[1] && cat)
    ws.push({
      id: uid(),
      type: "bar",
      title: `${nums[1]} by ${cat}`,
      metric: nums[1],
      dimension: cat,
      agg: "sum",
      w: 6,
      h: 2,
      color: 2,
    });
  ws.push({ id: uid(), type: "table", title: "Data detail", w: 6, h: 2 });
  return ws;
}

export type Template = {
  id: string;
  name: string;
  category: string;
  tag: string;
  theme: ThemeId;
  dataset: keyof typeof DATASETS;
  design: ReportDesign;
};
export const TEMPLATES: Template[] = [
  {
    id: "sales-exec",
    name: "Sales Executive",
    category: "Sales",
    tag: "Premium",
    theme: "midnight",
    dataset: "sales",
    design: "executive",
  },
  {
    id: "cfo",
    name: "CFO Finance",
    category: "Finance",
    tag: "Premium",
    theme: "light",
    dataset: "finance",
    design: "ledger",
  },
  {
    id: "mkt",
    name: "Marketing Growth",
    category: "Marketing",
    tag: "AI‑ready",
    theme: "light",
    dataset: "marketing",
    design: "growth",
  },
  {
    id: "hr",
    name: "HR Dashboard",
    category: "HR",
    tag: "Premium",
    theme: "light",
    dataset: "hr",
    design: "people",
  },
  {
    id: "health",
    name: "Healthcare Ops",
    category: "Healthcare",
    tag: "AI‑ready",
    theme: "light",
    dataset: "healthcare",
    design: "clinical",
  },
  {
    id: "ecom",
    name: "E‑commerce",
    category: "E‑commerce",
    tag: "Premium",
    theme: "light",
    dataset: "ecommerce",
    design: "commerce",
  },
  {
    id: "supply",
    name: "Supply Chain",
    category: "Supply Chain",
    tag: "Premium",
    theme: "midnight",
    dataset: "supply",
    design: "logistics",
  },
  {
    id: "energy",
    name: "Energy Grid",
    category: "Energy",
    tag: "Dark",
    theme: "forest",
    dataset: "energy",
    design: "grid",
  },
  {
    id: "regional",
    name: "Regional Sales",
    category: "Sales",
    tag: "Minimal",
    theme: "light",
    dataset: "atlas",
    design: "atlas",
  },
  {
    id: "agri",
    name: "Smart Agriculture",
    category: "Agriculture",
    tag: "AI‑ready",
    theme: "agriculture",
    dataset: "agriculture",
    design: "harvest",
  },
  {
    id: "iot",
    name: "IoT Smart City",
    category: "IoT/Smart City",
    tag: "Dark",
    theme: "iot",
    dataset: "iot",
    design: "sentinel",
  },
  {
    id: "aiml",
    name: "AI/ML Operations",
    category: "AI/ML Operations",
    tag: "AI‑ready",
    theme: "neon",
    dataset: "aimlops",
    design: "models",
  },
];

export function dashboardFromTemplate(t: Template): Dashboard {
  const dataset = DATASETS[t.dataset]();
  return {
    id: uid(),
    name: t.name,
    theme: t.theme,
    design: t.design,
    dataset,
    widgets: designWidgets(t.design, dataset, uid),
    designVersion: DESIGN_VERSION,
    filters: {},
    updatedAt: Date.now(),
  };
}

/** Only upgrade unedited legacy template layouts. Preserve IDs and user-authored reports. */
export function differentiateDashboard(d: Dashboard): Dashboard {
  if (d.design) {
    if ((d.designVersion ?? 1) >= DESIGN_VERSION || !isLegacyDesignLayout(d.design, d.widgets))
      return d;
    const template = TEMPLATES.find((t) => t.design === d.design);
    if (!template) return d;
    const dataset = LEGACY_DATASET_NAMES.includes(d.dataset.name)
      ? DATASETS[template.dataset]()
      : d.dataset;
    return {
      ...d,
      dataset,
      filters: {},
      designVersion: DESIGN_VERSION,
      widgets: designWidgets(d.design, dataset, uid),
    };
  }
  const template = TEMPLATES.find(
    (t) => t.name === d.name && DATASETS[t.dataset]().name === d.dataset.name,
  );
  if (!template) return d;
  const original = autoWidgets(d.dataset);
  const unchanged =
    d.widgets.length === original.length &&
    d.widgets.every((w, i) => {
      const base = original[i];
      return (
        base &&
        ["type", "title", "metric", "dimension", "agg", "w", "h", "color", "text"].every(
          (key) => w[key as keyof Widget] === base[key as keyof Widget],
        )
      );
    });
  if (!unchanged) return d;
  const dataset = DATASETS[template.dataset]();
  return {
    ...d,
    design: template.design,
    designVersion: DESIGN_VERSION,
    theme: template.theme,
    dataset,
    filters: {},
    widgets: designWidgets(template.design, dataset, uid),
  };
}

export function reportTheme(d: Dashboard) {
  return d.design
    ? {
        ...THEMES[d.theme],
        bg: "var(--report-bg)",
        card: "var(--report-card)",
        fg: "var(--report-fg)",
        muted: "var(--report-muted)",
        border: "var(--report-border)",
        palette: Array.from({ length: 5 }, (_, i) => `var(--report-${i + 1})`),
      }
    : THEMES[d.theme];
}
