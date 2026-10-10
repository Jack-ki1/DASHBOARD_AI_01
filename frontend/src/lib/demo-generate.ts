import {
  DATASETS,
  THEMES,
  autoWidgets,
  numericColumns,
  uid,
  type Dashboard,
  type Dataset,
  type ThemeId,
  type Widget,
} from "./dashboard";
import { computeInsights } from "./insights";

type DatasetKey = keyof typeof DATASETS;

const MATCHERS: { re: RegExp; key: DatasetKey }[] = [
  { re: /farm|crop|agri|yield|harvest|irrigation|soil/i, key: "agriculture" },
  { re: /iot|smart\s?city|sensor|device fleet|district/i, key: "iot" },
  { re: /\bml\b|\bai\b|model|mlops|inference|drift|llm/i, key: "aimlops" },
  { re: /financ|budget|profit|cash|expense|revenue|cfo/i, key: "finance" },
  { re: /market|campaign|traffic|leads?|seo|channel|acquisition/i, key: "marketing" },
  { re: /\bhr\b|hiring|attrition|headcount|workforce|employee|people/i, key: "hr" },
  { re: /health|hospital|clinic|patient|ward|care/i, key: "healthcare" },
  { re: /shop|e-?commerce|retail|store|cart|product sales/i, key: "ecommerce" },
  { re: /logistic|supply|ship|warehouse|fleet|deliver|route/i, key: "supply" },
  { re: /energy|grid|solar|wind|power|emission|utility/i, key: "energy" },
  { re: /region|territor|market share|country/i, key: "atlas" },
  { re: /sale|order|pipeline|quota/i, key: "sales" },
];

const THEME_HINTS: { re: RegExp; theme: ThemeId }[] = [
  { re: /dark|night|midnight/i, theme: "midnight" },
  { re: /neon|vibrant|colorful/i, theme: "neon" },
  { re: /ocean|sea|blue/i, theme: "ocean" },
  { re: /sunset|warm/i, theme: "sunset" },
  { re: /forest|green/i, theme: "forest" },
  { re: /minimal|mono|simple/i, theme: "minimal" },
  { re: /corporate|executive|board/i, theme: "corporate" },
  { re: /royal|premium/i, theme: "royal" },
];

function themeFor(prompt: string, key: DatasetKey): ThemeId {
  for (const h of THEME_HINTS) if (h.re.test(prompt)) return h.theme;
  if (key === "agriculture") return "agriculture";
  if (key === "iot") return "iot";
  if (key === "aimlops") return "neon";
  if (key === "healthcare") return "healthcare";
  if (key === "finance") return "finance";
  return "light";
}

function nameFor(prompt: string, fallback: string): string {
  const clean = prompt.replace(/\s+/g, " ").trim().slice(0, 60);
  if (clean.length >= 8) {
    return clean.charAt(0).toUpperCase() + clean.slice(1).replace(/[.?]+$/, "");
  }
  return fallback;
}

/**
 * Deterministic local dashboard generation. Used ONLY when the server AI is
 * unavailable (signed out, no key, no credits) and always labeled DEMO in UI.
 */
export function demoGenerate(
  prompt: string,
  uploaded: Dataset | null,
): { dashboard: Dashboard; datasetLabel: string; demo: true } {
  const key: DatasetKey = MATCHERS.find((m) => m.re.test(prompt))?.key ?? "sales";
  const dataset = uploaded ?? DATASETS[key]();
  const theme = themeFor(prompt, uploaded ? "sales" : key);
  const widgets = autoWidgets(dataset);
  const insights = computeInsights(dataset);
  const nums = numericColumns(dataset);
  if (insights[0] && nums[0]) {
    widgets.push({
      id: uid(),
      type: "insight",
      title: "Key finding (computed)",
      w: 12,
      h: 1,
      color: 0,
      text: insights
        .slice(0, 2)
        .map((i) => i.text)
        .join(" "),
    });
  }
  const dashboard: Dashboard = {
    id: uid(),
    name: nameFor(prompt, `${dataset.name} overview`),
    description: "Local demo generation — connect AI for live results.",
    theme,
    dataset,
    widgets,
    filters: {},
    updatedAt: Date.now(),
  };
  return {
    dashboard,
    datasetLabel: uploaded ? uploaded.name : dataset.name,
    demo: true as const,
  };
}

export function demoEdit(
  instruction: string,
  d: Dashboard,
): { dashboard: Dashboard; summary: string } | null {
  const text = instruction.toLowerCase();

  const themeHit = (Object.keys(THEMES) as ThemeId[]).find(
    (t) =>
      text.includes(t) ||
      text.includes(THEMES[t].label.toLowerCase()) ||
      (text.includes("dark") && ["midnight", "forest", "neon", "royal", "iot"].includes(t)),
  );
  if (/theme|dark|light|mode|color|style|brand/i.test(text) && themeHit) {
    return {
      dashboard: { ...d, theme: themeHit },
      summary: `(Demo) Applied the ${THEMES[themeHit].label} theme.`,
    };
  }
  if (/simplif|fewer|reduce|declutter|executive/i.test(text)) {
    return {
      dashboard: { ...d, widgets: d.widgets.slice(0, 6) },
      summary: `(Demo) Simplified to the first ${Math.min(6, d.widgets.length)} visuals. Undo with Ctrl+Z.`,
    };
  }
  if (/insight|finding|anomal|outlier|recommend|summar/i.test(text)) {
    const insights = computeInsights(d.dataset, d.filters);
    const body = insights.length
      ? insights
          .slice(0, 2)
          .map((i) => i.text)
          .join(" ")
      : "Not enough data to compute an insight for the current filter.";
    const nw: Widget = {
      id: uid(),
      type: "insight",
      title: "Key finding (computed)",
      w: 12,
      h: 1,
      color: 0,
      text: body,
    };
    const rest = d.widgets.filter((w) => w.type !== "insight");
    return {
      dashboard: { ...d, widgets: [...rest, nw] },
      summary: `(Demo) Added a computed insight from your actual data.`,
    };
  }
  if (/\bkpi\b|metric card|headline number/i.test(text)) {
    const metric = numericColumns(d.dataset)[0];
    if (!metric) return null;
    const nw: Widget = {
      id: uid(),
      type: "kpi",
      title: `Total ${metric}`,
      metric,
      agg: "sum",
      w: 3,
      h: 1,
      color: d.widgets.length % 5,
    };
    return {
      dashboard: { ...d, widgets: [...d.widgets, nw] },
      summary: `(Demo) Added a KPI for ${metric}.`,
    };
  }
  return null;
}
