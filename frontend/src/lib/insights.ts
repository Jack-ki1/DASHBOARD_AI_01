import {
  aggregate,
  applyFilters,
  categoryColumns,
  fmt,
  groupBy,
  numericColumns,
  type Cell,
  type Dataset,
} from "./dashboard";

export type Insight = {
  title: string;
  text: string;
  metric: string;
  detail: string;
};

function timeColumn(ds: Dataset): string | undefined {
  const cats = categoryColumns(ds);
  return (
    cats.find((c) => /^(month|date|week|quarter|year|day)$/i.test(c)) ??
    cats.find((c) => /month|date|year|week|day|quarter/i.test(c))
  );
}

/** Ordered distinct values of `col` by first appearance in the dataset. */
function periods(ds: Dataset, col: string): string[] {
  const seen: string[] = [];
  for (const r of ds.rows) {
    const v = String(r[col] ?? "");
    if (!seen.includes(v)) seen.push(v);
  }
  return seen;
}

/**
 * Data-grounded insights computed from actual rows — no model involved.
 * Every statement carries the metric, comparison and a limitation note.
 */
export function computeInsights(ds: Dataset, filters: Record<string, Cell> = {}): Insight[] {
  const rows = applyFilters(ds, filters);
  if (!rows.length) return [];
  const scoped: Dataset = { ...ds, rows };
  const nums = numericColumns(scoped);
  const cats = categoryColumns(scoped);
  if (!nums.length) return [];
  const out: Insight[] = [];
  const metric = nums[0];
  const time = timeColumn(scoped);
  const breakdown = cats.find((c) => c !== time) ?? cats[0];

  // 1. Period comparison on the primary metric.
  if (time) {
    const ps = periods(scoped, time);
    if (ps.length >= 3) {
      const series = groupBy(rows, time, metric, "sum");
      const byName = new Map(series.map((s) => [s.name, s.value]));
      const last = byName.get(ps[ps.length - 1]) ?? 0;
      const prev = ps
        .slice(0, -1)
        .map((p) => byName.get(p) ?? 0)
        .filter((v) => v > 0);
      if (prev.length) {
        const avg = prev.reduce((a, b) => a + b, 0) / prev.length;
        const pct = avg ? ((last - avg) / avg) * 100 : 0;
        const dir = pct >= 0 ? "above" : "below";
        out.push({
          title: `${metric} vs prior average`,
          text: `${metric} in ${ps[ps.length - 1]} (${fmt(last)}) was ${Math.abs(pct).toFixed(1)}% ${dir} the prior-period average (${fmt(avg)}).`,
          metric,
          detail: `Sum per ${time}, last vs mean of ${prev.length} prior periods. Seasonal effects not adjusted.`,
        });
      }
    }
  }

  // 2. Top contributor concentration.
  if (breakdown && breakdown !== time) {
    const parts = groupBy(rows, breakdown, metric, "sum").sort((a, b) => b.value - a.value);
    const total = parts.reduce((a, p) => a + p.value, 0);
    if (parts.length > 1 && total > 0 && parts[0]) {
      const share = (parts[0].value / total) * 100;
      out.push({
        title: `Top ${breakdown.toLowerCase()}`,
        text: `${parts[0].name} leads ${metric} with ${fmt(parts[0].value)} (${share.toFixed(1)}% of ${fmt(total)} across ${parts.length} ${breakdown.toLowerCase()}s).`,
        metric,
        detail: `Share of summed ${metric} over the current filter.`,
      });
    }
  }

  // 3. Simple outlier scan (z-score > 2) on the grouped primary series.
  if (time) {
    const series = groupBy(rows, time, metric, "sum").map((s) => s.value);
    if (series.length >= 5) {
      const mean = series.reduce((a, b) => a + b, 0) / series.length;
      const sd = Math.sqrt(series.reduce((a, b) => a + (b - mean) ** 2, 0) / series.length);
      if (sd > 0) {
        const ps = periods(scoped, time);
        const flagged = series
          .map((v, i) => ({ v, i, z: (v - mean) / sd }))
          .filter((p) => Math.abs(p.z) > 2);
        if (flagged.length && flagged[0]) {
          const f = flagged[0];
          out.push({
            title: "Possible outlier",
            text: `${ps[f.i]} (${fmt(f.v)}) deviates ${Math.abs(f.z).toFixed(1)}σ from the ${time.toLowerCase()}ly mean — worth checking before reporting it as a trend.`,
            metric,
            detail:
              "Naive z-score on grouped sums; not a statistical test. Verify with source data.",
          });
        }
      }
    }
  }

  // 4. Data-quality note (missing cells).
  const missing = rows.reduce(
    (n, r) => n + ds.columns.filter((c) => r[c] === "" || r[c] == null).length,
    0,
  );
  const totalCells = rows.length * ds.columns.length;
  if (totalCells > 0 && missing / totalCells > 0.01) {
    out.push({
      title: "Data completeness",
      text: `${missing.toLocaleString()} of ${totalCells.toLocaleString()} cells (${((missing / totalCells) * 100).toFixed(1)}%) are empty — aggregates ignore them.`,
      metric: ds.columns[0] ?? "rows",
      detail: "Empty cells excluded from sums/averages.",
    });
  } else {
    const total = aggregate(rows, metric, "sum");
    out.push({
      title: `Total ${metric}`,
      text: `The current selection totals ${fmt(total)} ${metric} across ${rows.length.toLocaleString()} rows.`,
      metric,
      detail: "Straight sum over the filtered rows.",
    });
  }

  return out.slice(0, 4);
}
