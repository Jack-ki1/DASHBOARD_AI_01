import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  aggregate,
  applyFilters,
  categoryColumns,
  fmt,
  groupBy,
  reportTheme,
  type Cell,
  type Dashboard,
  type Widget,
} from "@/lib/dashboard";

export function ExtendedChart({
  w,
  d,
  onFilter,
}: {
  w: Widget;
  d: Dashboard;
  onFilter?: (c: string, v: Cell) => void;
}) {
  const t = reportTheme(d);
  const rows = applyFilters(d.dataset, d.filters);
  const metric =
    w.metric ?? d.dataset.columns.find((c) => rows.some((r) => typeof r[c] === "number")) ?? "";
  const dim = w.dimension ?? d.dataset.columns[0];
  const color = t.palette[(w.color ?? 0) % 5];
  const data = groupBy(rows, dim, metric, w.agg);
  const tip = {
    contentStyle: {
      background: t.card,
      border: `1px solid ${t.border}`,
      borderRadius: 4,
      color: t.fg,
      fontSize: 11,
    },
  };
  const axis = { stroke: t.muted, fontSize: 9, tickLine: false, axisLine: false };
  const header = (
    <p className="mb-3 truncate text-xs font-semibold" style={{ color: t.fg }}>
      {w.title}
    </p>
  );
  if (w.type === "sparkline") {
    const total = aggregate(rows, metric, w.agg);
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex min-h-0 flex-1 items-center gap-4">
          <div className="min-w-0">
            <p className="text-2xl font-semibold" style={{ color: t.fg }}>
              {fmt(total)}
            </p>
            <p className="mt-1 text-[9px]" style={{ color: t.muted }}>
              {w.agg === "avg" ? "Average" : "Total"} · {metric}
            </p>
          </div>
          <div className="h-14 min-w-0 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <Tooltip {...tip} />
                <Area
                  dataKey="value"
                  type="monotone"
                  stroke={color}
                  strokeWidth={2}
                  fill={color}
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }
  if (w.type === "radial") {
    const total = data.reduce((sum, r) => sum + Math.max(0, r.value), 0);
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-4">
          {data.slice(0, 4).map((r, i) => {
            const pct = total ? (Math.max(0, r.value) / total) * 100 : 0;
            return (
              <Button
                variant="ghost"
                key={r.name}
                title={`${r.name}: ${fmt(r.value)}`}
                onClick={() => onFilter?.(dim, r.name)}
                className="h-auto w-full justify-start gap-3 p-0 text-left hover:bg-transparent"
              >
                <span
                  className="report-ring size-10 shrink-0 rounded-full"
                  style={{ background: `conic-gradient(${t.palette[i]} ${pct}%, ${t.border} 0)` }}
                >
                  <span
                    style={{ background: t.card, color: t.fg }}
                    className="m-1 grid size-8 place-items-center rounded-full text-[9px]"
                  >
                    {Math.round(pct)}%
                  </span>
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[10px]" style={{ color: t.muted }}>
                    {r.name}
                  </span>
                  <span className="block text-sm font-semibold" style={{ color: t.fg }}>
                    {fmt(r.value)}
                  </span>
                </span>
              </Button>
            );
          })}
          {!data.length && (
            <p className="text-xs" style={{ color: t.muted }}>
              No matching data
            </p>
          )}
        </div>
      </div>
    );
  }
  if (w.type === "heatmap") {
    const category = categoryColumns(d.dataset).find((c) => c !== dim) ?? dim;
    const categories = [...new Set(d.dataset.rows.map((r) => String(r[category])))].slice(0, 6);
    const periods = [...new Set(d.dataset.rows.map((r) => String(r[dim])))].slice(0, 12);
    const cells = categories.map((cat) =>
      periods.map((period) =>
        aggregate(
          rows.filter((r) => String(r[category]) === cat && String(r[dim]) === period),
          metric,
          w.agg,
        ),
      ),
    );
    const max = Math.max(1, ...cells.flat());
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-1 overflow-auto">
          <div
            className="grid min-w-[290px] gap-1"
            style={{
              gridTemplateColumns: `75px repeat(${Math.max(1, periods.length)}, minmax(14px, 1fr))`,
            }}
          >
            <span />
            {periods.map((p) => (
              <span key={p} className="truncate text-center text-[9px]" style={{ color: t.muted }}>
                {p}
              </span>
            ))}
            {categories.map((cat, i) => (
              <div key={cat} className="contents">
                <span className="self-center truncate text-[9px]" style={{ color: t.muted }}>
                  {cat}
                </span>
                {periods.map((period, j) => (
                  <Button
                    variant="ghost"
                    key={period}
                    aria-label={`${cat}, ${period}: ${fmt(cells[i][j])}`}
                    title={`${cat} · ${period}: ${fmt(cells[i][j])}`}
                    onClick={() => onFilter?.(category, cat)}
                    className="h-7 min-w-0 rounded-sm p-0"
                    style={{
                      background: color,
                      opacity: 0.12 + (Math.max(0, cells[i][j]) / max) * 0.88,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div
          className="mt-3 flex items-center justify-end gap-1 text-[9px]"
          style={{ color: t.muted }}
        >
          Low
          {[0.15, 0.4, 0.7, 1].map((opacity) => (
            <span
              key={opacity}
              className="size-2.5 rounded-sm"
              style={{ background: color, opacity }}
            />
          ))}
          High
        </div>
      </div>
    );
  }
  if (w.type === "radar")
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="65%">
              <PolarGrid stroke={t.border} />
              <PolarAngleAxis dataKey="name" tick={{ fill: t.muted, fontSize: 9 }} />
              <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.18} />
              <Tooltip {...tip} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  const category = categoryColumns(d.dataset).find((c) => c !== dim) ?? dim;
  const keys = [...new Set(rows.map((r) => String(r[category])))].slice(0, 5);
  const series = data.map(({ name }) => ({
    name,
    ...Object.fromEntries(
      keys.map((key) => [
        key,
        aggregate(
          rows.filter((r) => String(r[dim]) === name && String(r[category]) === key),
          metric,
          w.agg,
        ),
      ]),
    ),
  }));
  return (
    <div className="flex h-full flex-col">
      {header}
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series} barCategoryGap="30%">
            <CartesianGrid stroke={t.border} vertical={false} />
            <XAxis dataKey="name" {...axis} />
            <YAxis {...axis} width={34} tickFormatter={fmt} />
            <Tooltip {...tip} />
            {keys.map((key, i) => (
              <Bar
                key={key}
                name={key}
                dataKey={key}
                stackId="mix"
                fill={t.palette[i]}
                onClick={(e) => {
                  if (e?.name) onFilter?.(dim, String(e.name));
                }}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {keys.map((key, i) => (
          <span key={key} className="flex items-center gap-1 text-[9px]" style={{ color: t.muted }}>
            <span className="size-1.5 rounded-full" style={{ background: t.palette[i] }} />
            {key}
          </span>
        ))}
      </div>
    </div>
  );
}
