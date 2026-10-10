import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell as RCell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Sparkles, TrendingUp } from "lucide-react";
import {
  aggregate,
  applyFilters,
  fmt,
  groupBy,
  numericColumns,
  reportTheme,
  type Cell,
  type Dashboard,
  type Widget,
} from "@/lib/dashboard";
import { ExtendedChart } from "./ExtendedChart";
import { ReportHeading } from "./ReportHeading";

type Props = { w: Widget; d: Dashboard; onFilter?: (col: string, val: Cell) => void };

export function WidgetView({ w, d, onFilter }: Props) {
  const t = reportTheme(d);
  const rows = applyFilters(d.dataset, d.filters);
  const color = t.palette[(w.color ?? 0) % t.palette.length];
  const metric =
    (w.metric && d.dataset.columns.includes(w.metric) ? w.metric : numericColumns(d.dataset)[0]) ??
    "";
  const dim =
    w.dimension && d.dataset.columns.includes(w.dimension) ? w.dimension : d.dataset.columns[0];
  const tip = {
    contentStyle: {
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: 10,
      color: t.fg,
      fontSize: 12,
    },
  };
  const axis = { stroke: t.muted, fontSize: 10, tickLine: false, axisLine: false };
  if (["sparkline", "radial", "heatmap", "radar", "stacked"].includes(w.type))
    return <ExtendedChart w={w} d={d} onFilter={onFilter} />;

  const header = (
    <div className="mb-2 flex items-center justify-between gap-2">
      <p className="truncate text-xs font-semibold" style={{ color: t.fg }}>
        {w.title}
      </p>
    </div>
  );

  if (w.type === "kpi") {
    const v = aggregate(rows, metric, w.agg);
    const shown =
      w.format === "currency"
        ? `$${fmt(v)}`
        : w.format === "percent"
          ? `${(Number(v) || 0).toFixed(1)}%`
          : w.format === "minutes"
            ? `${Math.round(Number(v) || 0)} min`
            : w.format === "rating"
              ? `★ ${(Number(v) || 0).toFixed(1)}`
              : fmt(v);
    return (
      <div className="flex h-full flex-col justify-between">
        <p className="text-xs font-medium" style={{ color: t.muted }}>
          {w.title}
        </p>
        <p className="font-display text-2xl font-bold tracking-tight" style={{ color: t.fg }}>
          {shown}
        </p>
        <p
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: t.palette[2] }}
        >
          <TrendingUp className="h-3 w-3" />{" "}
          {w.agg === "avg" ? "Average" : w.agg === "count" ? "Records" : "Total"} · {metric}
        </p>
      </div>
    );
  }

  if (w.type === "insight") {
    return (
      <div className="flex h-full flex-col">
        <p
          className="mb-2 flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: color }}
        >
          <Sparkles className="h-3.5 w-3.5" /> {w.title}
        </p>
        <p className="text-sm leading-relaxed" style={{ color: t.fg }}>
          {w.text || "AI insight will appear here."}
        </p>
      </div>
    );
  }

  if (w.type === "table") {
    const cols = d.dataset.columns.slice(0, 6);
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-[11px]" style={{ color: t.fg }}>
            <thead>
              <tr style={{ color: t.muted }}>
                {cols.map((c) => (
                  <th
                    key={c}
                    className="sticky top-0 py-1 pr-3 font-semibold"
                    style={{ background: t.card }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 40).map((r, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${t.border}` }}>
                  {cols.map((c) => (
                    <td key={c} className="py-1 pr-3">
                      {typeof r[c] === "number" ? fmt(r[c] as number) : r[c]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const data = groupBy(rows, dim, metric, w.agg);
  const click = (e: { name?: string } | undefined) => e?.name && onFilter?.(dim, e.name);

  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          {w.type === "donut" ? (
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="55%"
                outerRadius="85%"
                paddingAngle={2}
                onClick={(e) => click(e as { name: string })}
                className="cursor-pointer"
              >
                {data.map((_, i) => (
                  <RCell key={i} fill={t.palette[i % t.palette.length]} stroke="none" />
                ))}
              </Pie>
              <Tooltip {...tip} />
            </PieChart>
          ) : w.type === "bar" || w.type === "funnel" || w.type === "horizontal" ? (
            <BarChart
              data={w.type !== "bar" ? [...data].sort((a, b) => b.value - a.value) : data}
              layout={w.type !== "bar" ? "vertical" : "horizontal"}
            >
              <CartesianGrid stroke={t.border} vertical={false} />
              {w.type !== "bar" ? (
                <>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="name" {...axis} width={95} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" {...axis} />
                  <YAxis {...axis} width={40} tickFormatter={fmt} />
                </>
              )}
              <Tooltip {...tip} cursor={{ fill: t.border }} />
              <Bar
                dataKey="value"
                radius={6}
                onClick={(e) => click(e as { name: string })}
                className="cursor-pointer"
              >
                {data.map((x, i) => (
                  <RCell
                    key={i}
                    fill={
                      d.filters[dim] && d.filters[dim] !== x.name
                        ? t.border
                        : w.type === "funnel"
                          ? t.palette[i % 5]
                          : color
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          ) : w.type === "line" ? (
            <LineChart data={data}>
              <CartesianGrid stroke={t.border} vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={40} tickFormatter={fmt} />
              <Tooltip {...tip} />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
            </LineChart>
          ) : (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`g-${w.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={t.border} vertical={false} />
              <XAxis dataKey="name" {...axis} />
              <YAxis {...axis} width={40} tickFormatter={fmt} />
              <Tooltip {...tip} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2.5}
                fill={`url(#g-${w.id})`}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const SPAN: Record<number, string> = {
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  12: "md:col-span-12",
};
export const spanClass = (w: number) => SPAN[w] ?? "md:col-span-6";
export const heightPx = (h: number) => (h === 1 ? 120 : h * 150);

/** Read-only full dashboard canvas */
export function DashboardCanvas({
  d,
  onFilter,
  compact,
}: {
  d: Dashboard;
  onFilter?: Props["onFilter"];
  compact?: boolean;
}) {
  const t = reportTheme(d);
  return (
    <div
      className={`dashboard-report report-${d.design ?? "default"} ${compact ? "report-compact" : ""} p-4`}
      data-design={d.design ?? "default"}
      style={{ background: t.bg }}
    >
      <ReportHeading d={d} />
      <div className="report-grid grid grid-cols-1 gap-3 md:grid-cols-12">
        {d.widgets.map((w) => (
          <div
            key={w.id}
            data-widget-type={w.type}
            className={`report-tile ${spanClass(w.w)} p-3`}
            style={{
              background: t.card,
              border: `1px solid ${t.border}`,
              height: compact ? heightPx(w.h) * 0.7 : heightPx(w.h),
            }}
          >
            <WidgetView w={w} d={d} onFilter={onFilter} />
          </div>
        ))}
      </div>
    </div>
  );
}
