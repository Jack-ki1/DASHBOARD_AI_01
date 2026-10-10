import { REPORT_DESIGNS } from "@/lib/report-designs";
import { reportTheme, type Dashboard } from "@/lib/dashboard";

export function ReportHeading({ d }: { d: Dashboard }) {
  const t = reportTheme(d);
  const design = d.design ? REPORT_DESIGNS[d.design] : undefined;
  return (
    <header
      className="report-heading flex items-center justify-between gap-3"
      style={{ borderColor: t.border, color: t.fg }}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className="report-monogram grid size-10 shrink-0 place-items-center text-xs font-semibold"
          style={{ background: t.palette[0], color: t.card }}
        >
          {design?.icon ?? "AI"}
        </span>
        <div className="min-w-0">
          <p
            className="mb-1 text-[9px] font-medium uppercase tracking-widest"
            style={{ color: t.muted }}
          >
            {design?.subtitle ?? "Performance overview"}
          </p>
          <h2 className="break-words text-lg font-semibold">{d.name}</h2>
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        <p className="text-[10px] font-medium">{d.dataset.name}</p>
        <p className="mt-1 text-[9px]" style={{ color: t.muted }}>
          {d.dataset.rows.length.toLocaleString()} records
        </p>
      </div>
    </header>
  );
}
