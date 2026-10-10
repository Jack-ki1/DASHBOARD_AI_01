import type { Dataset, Widget, WidgetType } from "./dashboard";

export const REPORT_DESIGNS = {
  executive: {
    label: "Executive",
    subtitle: "Commercial performance",
    layout: "Command center",
    icon: "01",
  },
  ledger: {
    label: "Ledger",
    subtitle: "Financial intelligence",
    layout: "Financial statement",
    icon: "02",
  },
  growth: {
    label: "Growth",
    subtitle: "Acquisition & engagement",
    layout: "Growth monitor",
    icon: "03",
  },
  people: {
    label: "People",
    subtitle: "Workforce intelligence",
    layout: "People pulse",
    icon: "04",
  },
  clinical: {
    label: "Clinical",
    subtitle: "Care delivery & capacity",
    layout: "Clinical operations",
    icon: "05",
  },
  commerce: {
    label: "Commerce",
    subtitle: "Store performance",
    layout: "Retail scorecard",
    icon: "06",
  },
  logistics: {
    label: "Logistics",
    subtitle: "Global distribution",
    layout: "Operations console",
    icon: "07",
  },
  grid: {
    label: "Grid",
    subtitle: "Generation & sustainability",
    layout: "Energy observatory",
    icon: "08",
  },
  atlas: {
    label: "Atlas",
    subtitle: "Markets & territories",
    layout: "Territory atlas",
    icon: "09",
  },
  harvest: {
    label: "Harvest",
    subtitle: "Yield & field conditions",
    layout: "Field monitor",
    icon: "10",
  },
  sentinel: {
    label: "Sentinel",
    subtitle: "Devices & districts",
    layout: "City operations",
    icon: "11",
  },
  models: {
    label: "Models",
    subtitle: "Performance & reliability",
    layout: "ML observatory",
    icon: "12",
  },
} as const;
export type ReportDesign = keyof typeof REPORT_DESIGNS;

type SpecBase = [WidgetType, string, string | undefined, string | undefined, number, number];
type Spec = SpecBase | [...SpecBase, number] | [...SpecBase, number, "sum" | "avg" | "count"];
const SPECS: Record<ReportDesign, Spec[]> = {
  executive: [
    ["kpi", "Total sales", "Sales", "Month", 4, 1, 0],
    ["sparkline", "Order momentum", "Orders", "Month", 4, 1, 1],
    ["kpi", "Total profit", "Profit", "Month", 4, 1, 2],
    ["area", "Sales trajectory", "Sales", "Month", 8, 2, 0],
    ["horizontal", "Territory leaderboard", "Sales", "Region", 4, 2, 1],
    ["stacked", "Product mix by month", "Sales", "Month", 7, 2, 0],
    ["donut", "Regional contribution", "Sales", "Region", 5, 2, 2],
  ],
  ledger: [
    ["sparkline", "Revenue ledger", "Revenue", "Month", 6, 1, 0],
    ["sparkline", "Operating expenses", "Expenses", "Month", 6, 1, 3],
    ["line", "Revenue & expense movement", "Revenue", "Month", 9, 2, 0],
    ["radial", "Revenue share by department", "Revenue", "Department", 3, 2, 1],
    ["horizontal", "Department expense ranking", "Expenses", "Department", 4, 2, 3],
    ["table", "Monthly financial ledger", undefined, undefined, 8, 2],
  ],
  growth: [
    ["area", "Audience acquisition", "Visitors", "Month", 8, 2, 0],
    ["funnel", "Lead-generating channels", "Leads", "Channel", 4, 2, 1],
    ["sparkline", "Visitor momentum", "Visitors", "Month", 4, 1, 0],
    ["kpi", "Qualified leads", "Leads", "Month", 4, 1, 1],
    ["sparkline", "Campaign investment", "Spend", "Month", 4, 1, 3],
    ["heatmap", "Monthly audience intensity", "Visitors", "Month", 7, 2, 2],
    ["donut", "Channel attribution", "Leads", "Channel", 5, 2, 1],
  ],
  people: [
    ["radial", "Workforce distribution", "Headcount", "Team", 4, 2, 0],
    ["bar", "Hiring across teams", "Hires", "Team", 8, 2, 1],
    ["kpi", "Average headcount", "Headcount", "Month", 4, 1, 0, "avg"],
    ["sparkline", "New hires", "Hires", "Month", 4, 1, 1],
    ["sparkline", "Attrition movement", "Attrition", "Month", 4, 1, 3],
    ["radar", "Team headcount profile", "Headcount", "Team", 5, 2, 2],
    ["line", "Hiring & attrition", "Hires", "Month", 7, 2, 1],
  ],
  clinical: [
    ["kpi", "Patient volume", "Patients", "Month", 3, 1, 0],
    ["kpi", "Admissions", "Admissions", "Month", 3, 1, 1],
    ["kpi", "Average wait · minutes", "Wait Minutes", "Month", 6, 1, 3, "avg"],
    ["heatmap", "Patient load by month", "Patients", "Month", 12, 2, 0],
    ["horizontal", "Ward capacity demand", "Admissions", "Ward", 4, 2, 1],
    ["line", "Waiting time trend", "Wait Minutes", "Month", 5, 2, 3, "avg"],
    ["radial", "Ward admission share", "Admissions", "Ward", 3, 2, 2],
  ],
  commerce: [
    ["sparkline", "Gross revenue", "Revenue", "Month", 5, 1, 0],
    ["kpi", "Orders placed", "Orders", "Month", 4, 1, 1],
    ["kpi", "Returns", "Returns", "Month", 3, 1, 3],
    ["donut", "Category revenue mix", "Revenue", "Category", 4, 2, 2],
    ["stacked", "Monthly category sales", "Revenue", "Month", 8, 2, 0],
    ["horizontal", "Bestselling categories", "Orders", "Category", 6, 2, 1],
    ["bar", "Returns by category", "Returns", "Category", 6, 2, 3],
  ],
  logistics: [
    ["horizontal", "Warehouse shipment ranking", "Shipments", "Warehouse", 5, 2, 1],
    ["area", "Shipment cadence", "Shipments", "Month", 7, 2, 0],
    ["sparkline", "Shipment volume", "Shipments", "Month", 3, 1, 0],
    ["sparkline", "On-time deliveries", "On Time", "Month", 5, 1, 2],
    ["kpi", "Distribution cost", "Cost", "Month", 4, 1, 3],
    ["table", "Warehouse dispatch ledger", undefined, undefined, 8, 2],
    ["radar", "Warehouse cost profile", "Cost", "Warehouse", 4, 2, 3],
  ],
  grid: [
    ["stacked", "Energy generation mix", "Output MWh", "Month", 9, 3, 0],
    ["radial", "Generation share", "Output MWh", "Source", 3, 3, 2],
    ["sparkline", "Total generation · MWh", "Output MWh", "Month", 6, 1, 0],
    ["sparkline", "Emissions trend", "Emissions", "Month", 6, 1, 3],
    ["horizontal", "Cost by source", "Cost", "Source", 5, 2, 1],
    ["area", "Emissions over time", "Emissions", "Month", 7, 2, 3],
  ],
  atlas: [
    ["horizontal", "Regional sales ranking", "Sales", "Region", 7, 3, 0],
    ["donut", "Market share", "Sales", "Region", 5, 3, 1],
    ["sparkline", "Sales across territories", "Sales", "Month", 6, 1, 0],
    ["sparkline", "Regional profit", "Profit", "Month", 6, 1, 2],
    ["heatmap", "Territory sales intensity", "Sales", "Month", 8, 2, 1],
    ["radar", "Regional order profile", "Orders", "Region", 4, 2, 3],
  ],
  harvest: [
    ["kpi", "Average yield · t/ha", "Yield t/ha", "Month", 4, 1, 0, "avg"],
    ["sparkline", "Rainfall · mm", "Rainfall mm", "Month", 4, 1, 1],
    ["sparkline", "Soil moisture · %", "Soil Moisture %", "Month", 4, 1, 2],
    ["area", "Yield trend", "Yield t/ha", "Month", 8, 2, 0],
    ["horizontal", "Yield by crop", "Yield t/ha", "Crop", 4, 2, 1],
    ["stacked", "Rainfall mix by month", "Rainfall mm", "Month", 7, 2, 1],
    ["donut", "Cost by crop", "Cost USD", "Crop", 5, 2, 3],
  ],
  sentinel: [
    ["kpi", "Devices online", "Online", "Month", 4, 1, 0],
    ["sparkline", "Energy consumption · MWh", "Energy MWh", "Month", 4, 1, 1],
    ["sparkline", "Active alerts", "Alerts", "Month", 4, 1, 3],
    ["area", "Energy over time", "Energy MWh", "Month", 8, 2, 0],
    ["horizontal", "Alerts by district", "Alerts", "District", 4, 2, 3],
    ["heatmap", "Device activity intensity", "Devices", "Month", 7, 2, 2],
    ["donut", "Energy by district", "Energy MWh", "District", 5, 2, 1],
  ],
  models: [
    ["kpi", "Total requests", "Requests", "Month", 4, 1, 0],
    ["sparkline", "Avg latency · ms", "Latency ms", "Month", 4, 1, 1, "avg"],
    ["sparkline", "Model errors", "Errors", "Month", 4, 1, 3],
    ["line", "Latency trend", "Latency ms", "Month", 8, 2, 1, "avg"],
    ["horizontal", "Requests by model", "Requests", "Model", 4, 2, 0],
    ["heatmap", "Request intensity", "Requests", "Month", 7, 2, 2],
    ["donut", "Error share by model", "Errors", "Model", 5, 2, 3],
  ],
};

export function designWidgets(design: ReportDesign, ds: Dataset, makeId: () => string): Widget[] {
  return SPECS[design].map((spec) => {
    const [type, title, metric, dimension, w, h] = spec;
    const color = spec[6] ?? 0;
    const agg = spec[7] ?? "sum";
    return {
      id: makeId(),
      type,
      title,
      metric: ds.columns.includes(metric ?? "") ? metric : undefined,
      dimension,
      w,
      h,
      color,
      agg,
    };
  });
}

/** Bump when SPECS change so stored dashboards can be migrated. */
export const DESIGN_VERSION = 2;

/**
 * True only when `widgets` structurally match the current spec for `design`
 * (same order, type, title, span and height — ids/metrics ignored).
 * Edited dashboards never match, so upgrades preserve user changes.
 */
export function isLegacyDesignLayout(design: ReportDesign, widgets: Widget[]): boolean {
  const spec = SPECS[design];
  if (!spec || widgets.length !== spec.length) return false;
  return spec.every(([type, title, , , w, h], i) => {
    const wdg = widgets[i];
    return !!wdg && wdg.type === type && wdg.title === title && wdg.w === w && wdg.h === h;
  });
}
