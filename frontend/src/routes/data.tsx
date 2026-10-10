import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, FileSpreadsheet, LayoutDashboard, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import {
  autoWidgets,
  numericColumns,
  parseCSV,
  parseJSON,
  salesDataset,
  uid,
  type Dataset,
} from "@/lib/dashboard";
import { projects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/data")({
  component: DataPage,
});

function DataPage() {
  useTitle("Data Workspace — DASHBOARD AI");
  const nav = useNavigate();
  const [ds, setDs] = useState<Dataset | null>(null);
  const [drag, setDrag] = useState(false);

  async function load(file: File) {
    if (file.size > 5 * 1024 * 1024)
      return toast.error("That file is over 5 MB. Try a smaller extract.");
    const isJson = /\.json$/i.test(file.name);
    if (!isJson && !/\.(csv|txt)$/i.test(file.name))
      return toast.error("Please upload a .csv or .json file (export Excel or Sheets as CSV).");
    try {
      const text = await file.text();
      const base = file.name.replace(/\.\w+$/, "");
      const d = isJson ? parseJSON(text, base) : parseCSV(text, base);
      if (!d.columns.length || !d.rows.length) return toast.error("That file looks empty.");
      if (d.rows.length >= 2000) toast.info("Loaded the first 2,000 rows.");
      setDs(d);
    } catch (e) {
      toast.error((e as Error).message || "Couldn't read that file.");
    }
  }

  const nums = ds ? numericColumns(ds) : [];
  const missing = ds
    ? ds.rows.reduce((n, r) => n + ds.columns.filter((c) => r[c] === "").length, 0)
    : 0;
  const duplicates = ds ? ds.rows.length - new Set(ds.rows.map((r) => JSON.stringify(r))).size : 0;
  const profiles = ds
    ? ds.columns.slice(0, 8).map((c) => {
        const numeric = nums.includes(c);
        const miss = ds.rows.filter((r) => r[c] === "" || r[c] == null).length;
        const distinct = new Set(ds.rows.map((r) => String(r[c]))).size;
        return { c, numeric, miss, distinct };
      })
    : [];

  function build() {
    if (!ds) return;
    const id = uid();
    projects.save({
      id,
      name: ds.name,
      theme: "light",
      dataset: ds,
      widgets: autoWidgets(ds),
      filters: {},
      updatedAt: Date.now(),
    });
    nav({ to: "/studio/$id", params: { id } });
  }
  function withAi() {
    if (!ds) return;
    sessionStorage.setItem("dashboard-ai:pending-dataset", JSON.stringify(ds));
    nav({
      to: "/generate",
      search: { prompt: `Build an executive dashboard for my ${ds.name} data` },
    });
  }

  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-semibold text-primary">Data workspace</p>
        <h1 className="mt-2 text-4xl font-bold">Connect. Prepare. Build.</h1>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files[0];
            if (f) load(f);
          }}
          className={`mt-8 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-accent" : "bg-card"}`}
        >
          <Upload className="h-8 w-8 text-primary" />
          <p className="mt-3 font-semibold">Drop a CSV or JSON file here, or click to upload</p>
          <p className="text-sm text-muted-foreground">
            Exports from Excel, Google Sheets, SQL tools and more. Max 5 MB / 2,000 rows.
          </p>
          <input
            type="file"
            accept=".csv,.json,text/csv,application/json"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && load(e.target.files[0])}
          />
        </label>
        <button
          onClick={() => setDs(salesDataset())}
          className="mt-3 text-sm font-semibold text-primary"
        >
          or try with sample sales data
        </button>

        {ds && (
          <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_280px]">
            <div className="surface overflow-hidden">
              <div className="flex items-center gap-2 border-b px-4 py-3 text-sm font-semibold">
                <FileSpreadsheet className="h-4 w-4 text-success" /> {ds.name}{" "}
                <span className="font-normal text-muted-foreground">
                  · {ds.rows.length} rows · {ds.columns.length} columns
                </span>
              </div>
              <div className="max-h-96 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-secondary">
                    <tr>
                      {ds.columns.map((c) => (
                        <th key={c} className="px-3 py-2 font-semibold">
                          {c}
                          <span className="ml-1 font-normal text-muted-foreground">
                            {nums.includes(c) ? "#" : "Aa"}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {ds.rows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t">
                        {ds.columns.map((c) => (
                          <td key={c} className="px-3 py-1.5">
                            {String(r[c])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="space-y-4">
              <div className="surface p-4 text-sm">
                <p className="mb-3 font-semibold">Data quality</p>
                {[
                  ["Rows", ds.rows.length],
                  ["Columns", ds.columns.length],
                  ["Numeric columns", nums.length],
                  ["Missing values", missing],
                  ["Duplicate rows", duplicates],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-1">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-semibold">{v}</span>
                  </div>
                ))}
                {profiles.length > 0 && (
                  <div className="mt-3 border-t pt-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Columns
                    </p>
                    {profiles.map((p) => (
                      <div
                        key={p.c}
                        className="flex items-center justify-between gap-2 py-1 text-xs"
                      >
                        <span className="truncate font-medium">
                          {p.c}
                          <span className="ml-1 font-normal text-muted-foreground">
                            {p.numeric ? "#" : "Aa"}
                          </span>
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {p.distinct} distinct{p.miss > 0 ? ` · ${p.miss} empty` : ""}
                        </span>
                      </div>
                    ))}
                    {ds.columns.length > 8 && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        + {ds.columns.length - 8} more columns
                      </p>
                    )}
                  </div>
                )}
                <p className="mt-2 flex items-center gap-1.5 text-xs text-success">
                  <CheckCircle2 className="h-4 w-4" /> Ready to visualize
                </p>
              </div>
              <button
                onClick={withAi}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-primary py-3 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                <Sparkles className="h-4 w-4" /> Generate with AI
              </button>
              <button
                onClick={build}
                className="flex w-full items-center justify-center gap-2 rounded-xl border bg-card py-3 text-sm font-semibold"
              >
                <LayoutDashboard className="h-4 w-4" /> Instant dashboard
              </button>
            </div>
          </div>
        )}
        <div className="mt-10">
          <h2 className="text-lg font-bold">Connectors</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Live connectors need server configuration — nothing here is connected yet.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              { name: "Google Sheets", need: "a server-side OAuth + Sheets read scope" },
              {
                name: "PostgreSQL",
                need: "a server-side connection string (SUPABASE_URL / service key stay server-only)",
              },
              {
                name: "REST API",
                need: "a server-side fetch proxy so credentials never reach the browser",
              },
            ].map((c) => (
              <button
                key={c.name}
                onClick={() => toast.info(`${c.name} needs ${c.need}. File upload works today.`)}
                className="surface p-4 text-left transition hover:-translate-y-0.5"
              >
                <p className="flex items-center gap-2 text-sm font-semibold">
                  {c.name}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                    SETUP REQUIRED
                  </span>
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Requires {c.need}.</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
