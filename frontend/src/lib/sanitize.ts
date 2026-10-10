import {
  THEMES,
  numericColumns,
  categoryColumns,
  uid,
  type Dataset,
  type ThemeId,
  type Widget,
  type WidgetType,
} from "./dashboard";

const TYPES: WidgetType[] = [
  "kpi",
  "line",
  "area",
  "bar",
  "donut",
  "table",
  "insight",
  "funnel",
  "sparkline",
  "horizontal",
  "stacked",
  "radial",
  "heatmap",
  "radar",
];
const SPANS = [3, 4, 6, 8, 12];
const FORMATS = ["currency", "percent", "number", "minutes", "rating"] as const;

export function sanitizeTheme(t: unknown): ThemeId {
  return typeof t === "string" && t in THEMES ? (t as ThemeId) : "light";
}

export function sanitizeWidgets(raw: unknown, ds: Dataset): Widget[] {
  if (!Array.isArray(raw)) return [];
  const nums = numericColumns(ds);
  const cats = categoryColumns(ds);
  return raw.slice(0, 24).flatMap((r: Record<string, unknown>) => {
    const type = TYPES.includes(r?.type as WidgetType) ? (r.type as WidgetType) : null;
    if (!type) return [];
    const w = Number(r.w);
    return [
      {
        id: typeof r.id === "string" && r.id ? r.id : uid(),
        type,
        title: String(r.title ?? "Untitled").slice(0, 80),
        metric: nums.includes(String(r.metric)) ? String(r.metric) : nums[0],
        dimension: cats.includes(String(r.dimension)) ? String(r.dimension) : cats[0],
        agg: r.agg === "avg" || r.agg === "count" ? r.agg : "sum",
        w: SPANS.includes(w) ? w : type === "kpi" ? 3 : 6,
        h: Math.min(3, Math.max(1, Number(r.h) || (type === "kpi" ? 1 : 2))),
        color: Math.abs(Number(r.color) || 0) % 5,
        text: typeof r.text === "string" ? r.text.slice(0, 400) : undefined,
        format: FORMATS.includes(r.format as (typeof FORMATS)[number])
          ? (r.format as Widget["format"])
          : undefined,
      } satisfies Widget,
    ];
  });
}
