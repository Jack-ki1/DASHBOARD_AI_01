import type { Dataset, Row } from "./dashboard";

/** Deterministic generators so SSR and the browser render identical demo reports. */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const season = (i: number, peak = 10, amp = 0.18) =>
  1 + amp * Math.cos(((i - peak) / 12) * Math.PI * 2);
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d;

export function salesData(): Dataset {
  const r = rng(101);
  const regions: [string, number][] = [
    ["North America", 1.35],
    ["Europe", 1.1],
    ["Asia Pacific", 0.95],
    ["Latin America", 0.55],
    ["Middle East & Africa", 0.42],
  ];
  const products: [string, number][] = [
    ["Enterprise Suite", 2.1],
    ["Cloud Platform", 1.6],
    ["Analytics Pro", 1.05],
    ["Mobile SDK", 0.6],
    ["Support Plans", 0.45],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    regions.forEach(([reg, rw]) =>
      products.forEach(([p, pw]) => {
        const base = 9000 * rw * pw * season(i, 11) * (1 + i * 0.022);
        const sales = Math.round(base * (0.88 + r() * 0.24));
        const target = Math.round(base * 1.02);
        rows.push({
          Month: m,
          Region: reg,
          Product: p,
          Sales: sales,
          Target: target,
          "Prior Year": Math.round(sales * (0.8 + r() * 0.12)),
          Orders: Math.round(sales / (180 + r() * 90)),
          Profit: Math.round(sales * (0.18 + r() * 0.14)),
          "Win Rate": round(22 + r() * 18, 1),
        });
      }),
    ),
  );
  return {
    name: "Global Sales FY26",
    columns: [
      "Month",
      "Region",
      "Product",
      "Sales",
      "Target",
      "Prior Year",
      "Orders",
      "Profit",
      "Win Rate",
    ],
    rows,
  };
}

export function financeData(): Dataset {
  const r = rng(202);
  const units: [string, number][] = [
    ["Products", 1.6],
    ["Services", 1.0],
    ["Licensing", 0.7],
    ["Hardware", 0.55],
    ["Consulting", 0.4],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    units.forEach(([u, w]) => {
      const revenue = Math.round(
        52000 * w * season(i, 11, 0.12) * (1 + i * 0.015) * (0.93 + r() * 0.14),
      );
      const cogs = Math.round(revenue * (0.36 + r() * 0.08));
      const opex = Math.round(revenue * (0.22 + r() * 0.06));
      const tax = Math.round((revenue - cogs - opex) * 0.21);
      rows.push({
        Month: m,
        "Business Unit": u,
        Revenue: revenue,
        Budget: Math.round(revenue * (0.94 + r() * 0.12)),
        COGS: cogs,
        OpEx: opex,
        Tax: tax,
        "Net Income": revenue - cogs - opex - tax,
        "Cash Flow": Math.round((revenue - cogs - opex) * (0.7 + r() * 0.4)),
      });
    }),
  );
  return {
    name: "Financial Statements FY26",
    columns: [
      "Month",
      "Business Unit",
      "Revenue",
      "Budget",
      "COGS",
      "OpEx",
      "Tax",
      "Net Income",
      "Cash Flow",
    ],
    rows,
  };
}

export function marketingData(): Dataset {
  const r = rng(303);
  const channels: [string, number, number][] = [
    ["Organic Search", 1.5, 0.3],
    ["Paid Social", 1.2, 1.6],
    ["Email", 0.6, 0.2],
    ["Referral", 0.45, 0.4],
    ["Paid Search", 1.0, 1.3],
    ["Partnerships", 0.3, 0.7],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    channels.forEach(([c, w, cost]) => {
      const visitors = Math.round(18000 * w * (1 + i * 0.05) * (0.9 + r() * 0.2));
      const signups = Math.round(visitors * (0.05 + r() * 0.03));
      const trials = Math.round(signups * (0.42 + r() * 0.12));
      const paid = Math.round(trials * (0.18 + r() * 0.1));
      const spend = Math.round(4200 * cost * (1 + i * 0.03) * (0.9 + r() * 0.2));
      rows.push({
        Month: m,
        Channel: c,
        Visitors: visitors,
        Signups: signups,
        Trials: trials,
        Customers: paid,
        Spend: spend,
        Revenue: paid * Math.round(380 + r() * 220),
        "Retention %": round(48 + r() * 35, 1),
      });
    }),
  );
  return {
    name: "Growth Funnel FY26",
    columns: [
      "Month",
      "Channel",
      "Visitors",
      "Signups",
      "Trials",
      "Customers",
      "Spend",
      "Revenue",
      "Retention %",
    ],
    rows,
  };
}

export function peopleData(): Dataset {
  const r = rng(404);
  const teams: [string, number][] = [
    ["Engineering", 180],
    ["Product", 46],
    ["Design", 28],
    ["Sales", 92],
    ["Customer Success", 64],
    ["Operations", 38],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    teams.forEach(([t, base]) => {
      const head = Math.round(base * (1 + i * 0.012) * (0.98 + r() * 0.04));
      rows.push({
        Month: m,
        Team: t,
        Headcount: head,
        Hires: Math.round(head * (0.02 + r() * 0.03)),
        Leavers: Math.round(head * (0.006 + r() * 0.018)),
        "Tenure Years": round(1.4 + r() * 4.2, 1),
        eNPS: Math.round(18 + r() * 46),
        "Avg Salary": Math.round(68000 + base * 120 + r() * 22000),
        "Women %": round(28 + r() * 30, 1),
      });
    }),
  );
  return {
    name: "People Analytics 2026",
    columns: [
      "Month",
      "Team",
      "Headcount",
      "Hires",
      "Leavers",
      "Tenure Years",
      "eNPS",
      "Avg Salary",
      "Women %",
    ],
    rows,
  };
}

export function clinicalData(): Dataset {
  const r = rng(505);
  const wards: [string, number][] = [
    ["Emergency", 64],
    ["Cardiology", 42],
    ["Oncology", 38],
    ["Pediatrics", 30],
    ["Orthopedics", 34],
    ["ICU", 22],
  ];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    wards.forEach(([w, beds]) =>
      days.forEach((d, k) => {
        const weekend = k >= 5 ? (w === "Emergency" ? 1.25 : 0.75) : 1;
        const patients = Math.round(beds * 1.6 * season(i, 0, 0.2) * weekend * (0.85 + r() * 0.3));
        const occupied = Math.min(beds, Math.round(beds * (0.68 + r() * 0.3) * season(i, 0, 0.08)));
        rows.push({
          Month: m,
          Ward: w,
          Day: d,
          Patients: patients,
          Admissions: Math.round(patients * (0.32 + r() * 0.12)),
          Discharges: Math.round(patients * (0.3 + r() * 0.12)),
          "Wait Minutes": Math.round((w === "Emergency" ? 38 : 18) * weekend * (0.7 + r() * 0.7)),
          Beds: beds,
          Occupied: occupied,
          Satisfaction: round(3.6 + r() * 1.3, 1),
        });
      }),
    ),
  );
  return {
    name: "Hospital Operations 2026",
    columns: [
      "Month",
      "Ward",
      "Day",
      "Patients",
      "Admissions",
      "Discharges",
      "Wait Minutes",
      "Beds",
      "Occupied",
      "Satisfaction",
    ],
    rows,
  };
}

export function commerceData(): Dataset {
  const r = rng(606);
  const catalog: [string, string, number, number][] = [
    ["Apparel", "Linen Overshirt", 1.4, 89],
    ["Apparel", "Merino Crew", 1.1, 120],
    ["Home", "Stoneware Set", 0.9, 145],
    ["Home", "Wool Throw", 0.7, 110],
    ["Beauty", "Botanical Serum", 1.3, 54],
    ["Beauty", "Clay Mask", 0.8, 32],
    ["Electronics", "Studio Earbuds", 1.0, 179],
    ["Electronics", "Smart Lamp", 0.6, 99],
    ["Outdoor", "Trail Pack 28L", 0.75, 135],
    ["Outdoor", "Insulated Bottle", 1.2, 38],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    catalog.forEach(([c, p, w, price]) => {
      const units = Math.round(420 * w * season(i, 11, 0.32) * (0.85 + r() * 0.3));
      const sessions = Math.round(units * (38 + r() * 20));
      rows.push({
        Month: m,
        Category: c,
        Product: p,
        Revenue: units * price,
        Units: units,
        Orders: Math.round(units / (1.2 + r() * 0.6)),
        Sessions: sessions,
        "Add to Cart": Math.round(sessions * (0.09 + r() * 0.04)),
        Checkout: Math.round(sessions * (0.04 + r() * 0.02)),
        Returns: Math.round(units * (0.03 + r() * 0.07)),
        "Order Value": Math.round(price * (1.1 + r() * 0.9)),
        Rating: round(3.9 + r() * 1.05, 1),
      });
    }),
  );
  return {
    name: "Store Performance 2026",
    columns: [
      "Month",
      "Category",
      "Product",
      "Revenue",
      "Units",
      "Orders",
      "Sessions",
      "Add to Cart",
      "Checkout",
      "Returns",
      "Order Value",
      "Rating",
    ],
    rows,
  };
}

export function logisticsData(): Dataset {
  const r = rng(707);
  const hubs: [string, number][] = [
    ["Rotterdam", 1.4],
    ["Singapore", 1.3],
    ["Los Angeles", 1.15],
    ["Dubai", 0.9],
    ["Nairobi", 0.6],
    ["São Paulo", 0.7],
    ["Shanghai", 1.35],
    ["Hamburg", 0.85],
  ];
  const modes = ["Ocean", "Air", "Road"];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    hubs.forEach(([h, w]) =>
      modes.forEach((mode, k) => {
        const shipments = Math.round(
          320 * w * [1, 0.35, 0.8][k] * season(i, 10, 0.15) * (0.88 + r() * 0.24),
        );
        const onTimeRate = (k === 1 ? 0.95 : k === 0 ? 0.82 : 0.9) - r() * 0.12;
        const onTime = Math.round(shipments * onTimeRate);
        rows.push({
          Month: m,
          Hub: h,
          Mode: mode,
          Status: onTimeRate > 0.88 ? "On track" : onTimeRate > 0.8 ? "At risk" : "Delayed",
          Shipments: shipments,
          "On Time": onTime,
          Late: shipments - onTime,
          "Cost USD": Math.round(shipments * [1200, 4800, 600][k] * (0.9 + r() * 0.2)),
          "Transit Days": round([24, 3, 5][k] * (0.85 + r() * 0.4), 1),
          "Fill Rate": round(78 + r() * 20, 1),
        });
      }),
    ),
  );
  return {
    name: "Global Distribution Network",
    columns: [
      "Month",
      "Hub",
      "Mode",
      "Status",
      "Shipments",
      "On Time",
      "Late",
      "Cost USD",
      "Transit Days",
      "Fill Rate",
    ],
    rows,
  };
}

export function energyData(): Dataset {
  const r = rng(808);
  const sources: [string, number, number, number][] = [
    ["Solar", 420, 6, 0],
    ["Wind", 610, 3, 0],
    ["Hydro", 380, 4, 0],
    ["Natural Gas", 520, 2, 0.45],
    ["Nuclear", 700, 0, 0.01],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    sources.forEach(([s, base, peak, ef]) => {
      const amp = s === "Solar" ? 0.45 : s === "Wind" ? 0.25 : s === "Hydro" ? 0.2 : 0.05;
      const output = Math.round(
        base *
          1000 *
          season(i, peak, amp) *
          (0.92 + r() * 0.16) *
          (s === "Solar" || s === "Wind" ? 1 + i * 0.02 : 1),
      );
      rows.push({
        Month: m,
        Source: s,
        "Output MWh": output,
        "Capacity MWh": Math.round(base * 1000 * 1.25),
        Demand: Math.round(output * (0.9 + r() * 0.25)),
        "Cost per MWh": Math.round(
          [38, 42, 30, 78, 64][sources.findIndex((x) => x[0] === s)] * (0.9 + r() * 0.2),
        ),
        "CO2 Tonnes": Math.round(output * ef),
        Availability: round(86 + r() * 13, 1),
      });
    }),
  );
  return {
    name: "Grid Generation 2026",
    columns: [
      "Month",
      "Source",
      "Output MWh",
      "Capacity MWh",
      "Demand",
      "Cost per MWh",
      "CO2 Tonnes",
      "Availability",
    ],
    rows,
  };
}

export function atlasData(): Dataset {
  const r = rng(909);
  const markets: [string, string, number][] = [
    ["United States", "Americas", 2.4],
    ["Canada", "Americas", 0.7],
    ["Brazil", "Americas", 0.8],
    ["Mexico", "Americas", 0.6],
    ["United Kingdom", "Europe", 1.1],
    ["Germany", "Europe", 1.3],
    ["France", "Europe", 0.95],
    ["Spain", "Europe", 0.55],
    ["Japan", "Asia Pacific", 1.2],
    ["India", "Asia Pacific", 0.9],
    ["Australia", "Asia Pacific", 0.65],
    ["South Africa", "Africa", 0.35],
    ["Kenya", "Africa", 0.28],
    ["Nigeria", "Africa", 0.4],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    markets.forEach(([c, reg, w]) => {
      const growth =
        1 + i * (0.01 + (reg === "Africa" ? 0.035 : reg === "Asia Pacific" ? 0.022 : 0.008));
      const sales = Math.round(26000 * w * growth * (0.9 + r() * 0.2));
      rows.push({
        Month: m,
        Market: c,
        Region: reg,
        Sales: sales,
        "Prior Year": Math.round(sales / (1.02 + r() * 0.22)),
        Customers: Math.round(sales / (90 + r() * 60)),
        "Market Share": round(4 + w * 6 + r() * 4, 1),
        "Growth %": round((growth - 1) * 100 + r() * 6, 1),
      });
    }),
  );
  return {
    name: "Market Territories 2026",
    columns: [
      "Month",
      "Market",
      "Region",
      "Sales",
      "Prior Year",
      "Customers",
      "Market Share",
      "Growth %",
    ],
    rows,
  };
}

export function agriData(): Dataset {
  const r = rng(1001);
  const crops: [string, number][] = [
    ["Wheat", 1.3],
    ["Maize", 1.5],
    ["Soy", 1.0],
    ["Rice", 1.2],
    ["Barley", 0.7],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    crops.forEach(([c, w]) => {
      const rain = Math.round((40 + 90 * season(i, 3, 0.55)) * (0.7 + r() * 0.6));
      const moisture = round(18 + rain * 0.12 + r() * 8, 1);
      const temp = round(24 + 9 * Math.sin(((i - 6) / 12) * Math.PI * 2) + r() * 2, 1);
      const yieldVal = round(
        w * 3.4 * season(i, 7, 0.22) * (0.75 + moisture / 120) * (0.9 + r() * 0.2),
        2,
      );
      rows.push({
        Month: m,
        Crop: c,
        "Yield t/ha": yieldVal,
        "Rainfall mm": rain,
        "Soil Moisture %": moisture,
        "Temp C": temp,
        "Irrigation ML": round(yieldVal * (1.4 + r() * 0.8), 1),
        "Cost USD": Math.round(900 * w * (0.9 + r() * 0.2)),
      });
    }),
  );
  return {
    name: "Smart Farm 2026",
    columns: [
      "Month",
      "Crop",
      "Yield t/ha",
      "Rainfall mm",
      "Soil Moisture %",
      "Temp C",
      "Irrigation ML",
      "Cost USD",
    ],
    rows,
  };
}

export function iotData(): Dataset {
  const r = rng(1102);
  const districts = ["Downtown", "Harbor", "Uptown", "Westside", "Airport", "University"];
  const types = ["Air Quality", "Traffic", "Energy Meter", "Water"];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    districts.forEach((d, k) =>
      types.forEach((t) => {
        const devices = Math.round(120 + k * 45 + (t === "Traffic" ? 60 : 0) + r() * 30);
        const online = Math.min(devices, Math.round(devices * (0.93 + r() * 0.06)));
        const alerts = Math.round(
          devices * (0.008 + r() * 0.03) * (t === "Energy Meter" && i >= 5 && i <= 7 ? 2.2 : 1),
        );
        rows.push({
          Month: m,
          District: d,
          "Device Type": t,
          Devices: devices,
          Online: online,
          Offline: devices - online,
          "Energy MWh": Math.round(devices * (1.1 + r() * 0.7) * season(i, 6, 0.25)),
          Alerts: alerts,
          "Uptime %": round((online / devices) * 100, 1),
        });
      }),
    ),
  );
  return {
    name: "Smart City Sensors 2026",
    columns: [
      "Month",
      "District",
      "Device Type",
      "Devices",
      "Online",
      "Offline",
      "Energy MWh",
      "Alerts",
      "Uptime %",
    ],
    rows,
  };
}

export function aimlData(): Dataset {
  const r = rng(1203);
  const models: [string, number][] = [
    ["Vision v4", 1.6],
    ["Recommend v9", 2.2],
    ["Fraud Shield", 1.1],
    ["Chat 3.5", 2.8],
    ["Forecast XL", 0.7],
  ];
  const rows: Row[] = [];
  MONTHS.forEach((m, i) =>
    models.forEach(([model, w]) => {
      const requests = Math.round(420000 * w * (1 + i * 0.06) * (0.88 + r() * 0.24));
      const latency = round(
        (model.startsWith("Chat") ? 640 : 120) * (1 - i * 0.008) * (0.9 + r() * 0.2),
        0,
      );
      const errors = Math.round(requests * (0.001 + r() * 0.004) * (i === 8 ? 2.5 : 1));
      rows.push({
        Month: m,
        Model: model,
        Requests: requests,
        "Latency ms": latency,
        "Accuracy %": round(91 + r() * 8 - (i === 8 ? 3 : 0), 1),
        Errors: errors,
        "Error Rate %": round((errors / requests) * 100, 2),
        "Drift Score": round(0.05 + r() * 0.2 + (i >= 9 ? 0.15 : 0), 2),
        "Cost USD": Math.round(requests * 0.00042 * (0.9 + r() * 0.2)),
      });
    }),
  );
  return {
    name: "ML Platform Ops 2026",
    columns: [
      "Month",
      "Model",
      "Requests",
      "Latency ms",
      "Accuracy %",
      "Errors",
      "Error Rate %",
      "Drift Score",
      "Cost USD",
    ],
    rows,
  };
}
