import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BarChart3,
  Copy,
  Download,
  Eye,
  FilterX,
  Gauge,
  History,
  Layers,
  LineChart,
  Loader2,
  PieChart,
  Plus,
  Redo2,
  Send,
  Share2,
  Sparkles,
  Table2,
  Trash2,
  TrendingUp,
  Undo2,
  AreaChart,
  Lightbulb,
  Filter,
  Database,
  Printer,
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Sigma,
  Type,
  PanelRightClose,
  SlidersHorizontal,
  LayoutDashboard,
  Paintbrush,
  Minus,
  Maximize2,
  CheckSquare,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "@/components/CommandPalette";
import { StudioRibbon, VISUALS } from "@/components/StudioRibbon";
import { DashboardCanvas, WidgetView, spanClass, heightPx } from "@/components/Widget";
import {
  THEMES,
  reportTheme,
  categoryColumns,
  numericColumns,
  uid,
  type Cell,
  type Dashboard,
  type ThemeId,
  type Widget,
  type WidgetType,
} from "@/lib/dashboard";
import { api } from "@/lib/api";
import { demoEdit } from "@/lib/demo-generate";
import { sanitizeTheme, sanitizeWidgets } from "@/lib/sanitize";
import { ReportHeading } from "@/components/ReportHeading";
import { projects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/studio/$id")({
  component: StudioPage,
});

const LIBRARY = VISUALS;
const COPILOT = [
  "Make it executive-ready",
  "Switch to a dark theme",
  "Add a profit trend chart",
  "Add an insight about the top performer",
  "Simplify to 6 widgets",
];

function StudioPage() {
  useTitle("Studio — DASHBOARD AI");
  const { id } = Route.useParams();
  const [d, setD] = useState<Dashboard | null | undefined>(undefined);
  useEffect(() => setD(projects.get(id) ?? null), [id]);
  if (d === undefined)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (!d)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <p className="font-display text-lg font-semibold">Dashboard not found</p>
          <Link to="/workspace" className="mt-3 inline-block text-sm font-semibold text-primary">
            Back to workspace
          </Link>
        </div>
      </div>
    );
  return <Studio initial={d} />;
}

function Studio({ initial }: { initial: Dashboard }) {
  const [d, setDRaw] = useState(initial);
  const [past, setPast] = useState<Dashboard[]>([]);
  const [future, setFuture] = useState<Dashboard[]>([]);
  const [sel, setSel] = useState<string | null>(null);
  const [left, setLeft] = useState<"components" | "layers" | "versions">("components");
  const [right, setRight] = useState<"format" | "ai">("format");
  const [showLayers, setShowLayers] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [fieldSearch, setFieldSearch] = useState("");
  const [zoom, setZoom] = useState(100);
  const [dataExpanded, setDataExpanded] = useState(true);
  const [showData, setShowData] = useState(false);
  const [preview, setPreview] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const set = useCallback((next: Dashboard | ((p: Dashboard) => Dashboard)) => {
    setDRaw((prev) => {
      const n = typeof next === "function" ? next(prev) : next;
      setPast((p) => [...p.slice(-40), prev]);
      setFuture([]);
      return n;
    });
  }, []);
  useEffect(() => {
    const t = setTimeout(() => projects.save(d), 400);
    return () => clearTimeout(t);
  }, [d]);

  const undo = () => {
    const p = past.at(-1);
    if (!p) return;
    setFuture((f) => [d, ...f]);
    setPast(past.slice(0, -1));
    setDRaw(p);
  };
  const redo = () => {
    const f = future[0];
    if (!f) return;
    setPast((p) => [...p, d]);
    setFuture(future.slice(1));
    setDRaw(f);
  };
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        projects.save(d);
        toast.success("Dashboard saved");
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d" && sel) {
        e.preventDefault();
        dupW(sel);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.key === "Delete" || e.key === "Backspace") && sel) removeW(sel);
      if (e.key === "Escape") {
        setSel(null);
        setPreview(false);
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  });

  const selected = d.widgets.find((w) => w.id === sel);
  const updW = (wid: string, patch: Partial<Widget>) =>
    set((p) => ({ ...p, widgets: p.widgets.map((w) => (w.id === wid ? { ...w, ...patch } : w)) }));
  const removeW = (wid: string) => {
    set((p) => ({ ...p, widgets: p.widgets.filter((w) => w.id !== wid) }));
    setSel(null);
  };
  const dupW = (wid: string) =>
    set((p) => {
      const i = p.widgets.findIndex((w) => w.id === wid);
      const c = { ...p.widgets[i], id: uid(), title: p.widgets[i].title + " copy" };
      const ws = [...p.widgets];
      ws.splice(i + 1, 0, c);
      return { ...p, widgets: ws };
    });
  const moveW = (wid: string, dir: -1 | 1) =>
    set((p) => {
      const ws = [...p.widgets];
      const i = ws.findIndex((w) => w.id === wid);
      const j = i + dir;
      if (j < 0 || j >= ws.length) return p;
      [ws[i], ws[j]] = [ws[j], ws[i]];
      return { ...p, widgets: ws };
    });
  const addW = (type: WidgetType, w: number, h: number, label: string) => {
    const nw: Widget = {
      id: uid(),
      type,
      title: label,
      metric: numericColumns(d.dataset)[0],
      dimension: categoryColumns(d.dataset)[0],
      agg: "sum",
      w,
      h,
      color: d.widgets.length % 5,
      text:
        type === "insight"
          ? "Write your insight here, or ask the copilot to generate one."
          : undefined,
    };
    set((p) => ({ ...p, widgets: [...p.widgets, nw] }));
    setSel(nw.id);
    setRight("format");
  };
  const onFilter = (c: string, v: Cell) =>
    setDRaw((p) => ({ ...p, filters: p.filters[c] === v ? {} : { ...p.filters, [c]: v } }));
  const saveVersion = () => {
    const label = `Version ${(d.versions?.length ?? 0) + 1}`;
    set((p) => ({
      ...p,
      versions: [
        { at: Date.now(), label, widgets: p.widgets, theme: p.theme },
        ...(p.versions ?? []),
      ].slice(0, 20),
    }));
    toast.success(`${label} saved`);
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${d.name}.json`;
    a.click();
  };
  const exportCsv = () => {
    const rows = [
      d.dataset.columns.join(","),
      ...d.dataset.rows.map((r) =>
        d.dataset.columns.map((c) => JSON.stringify(r[c] ?? "")).join(","),
      ),
    ];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    a.download = `${d.name}.csv`;
    a.click();
  };

  const t = reportTheme(d);
  const filters = Object.entries(d.filters);

  if (preview)
    return (
      <div
        className={`dashboard-report report-${d.design ?? "default"} min-h-screen p-6`}
        style={{ background: t.bg }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ color: t.fg }}>
              {d.name}
            </h1>
            <Button
              variant="ghost"
              onClick={() => setPreview(false)}
              className="rounded-lg bg-card px-3 py-1.5 text-sm font-semibold shadow-card"
            >
              Exit preview (Esc)
            </Button>
          </div>
          <DashboardCanvas d={d} onFilter={onFilter} />
        </div>
      </div>
    );

  return (
    <div className="studio-shell flex h-dvh flex-col overflow-hidden bg-studio-stage print:h-auto">
      <CommandPalette />
      <header className="flex h-12 shrink-0 items-center gap-3 bg-studio-chrome px-3 text-studio-chrome-foreground print:hidden">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="size-8 hover:bg-studio-chrome-foreground/10 hover:text-studio-chrome-foreground"
        >
          <Link to="/workspace" aria-label="Back to workspace">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <LayoutDashboard className="size-5 shrink-0" />
        <span className="hidden border-r border-studio-chrome-foreground/20 pr-4 text-xs font-semibold sm:block">
          DASHBOARD AI <span className="ml-1 font-normal opacity-60">Studio</span>
        </span>
        <input
          aria-label="Report name"
          value={d.name}
          onChange={(e) => setDRaw({ ...d, name: e.target.value })}
          className="min-w-0 flex-1 bg-transparent text-xs font-semibold outline-none"
        />
        {d.description?.toLowerCase().includes("demo") && (
          <span
            title="Built by local demo generation — sign in with AI credits for live AI results"
            className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-200"
          >
            DEMO
          </span>
        )}
        <span className="hidden items-center gap-1.5 text-[10px] opacity-70 md:flex">
          <Check className="size-3" /> Autosave on
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPreview(true)}
          className="hover:bg-studio-chrome-foreground/10 hover:text-studio-chrome-foreground"
        >
          <Eye /> <span className="hidden sm:inline">Preview</span>
        </Button>
        <Button size="sm" onClick={() => setShareOpen(true)}>
          <Share2 /> Publish
        </Button>
      </header>
      <StudioRibbon
        undo={undo}
        redo={redo}
        canUndo={!!past.length}
        canRedo={!!future.length}
        add={addW}
        data={() => setShowData((v) => !v)}
        copilot={() => {
          setRight("ai");
          setShowInspector(true);
        }}
        preview={() => setPreview(true)}
        layers={() => {
          setShowLayers((v) => !v);
          setLeft("layers");
        }}
        versions={() => {
          setShowLayers(true);
          setLeft("versions");
        }}
        selected={!!selected}
        duplicate={() => sel && dupW(sel)}
        remove={() => sel && removeW(sel)}
        theme={d.theme}
        setTheme={(theme) => set({ ...d, theme, design: undefined })}
        exportCsv={exportCsv}
        exportJson={exportJson}
        print={() => window.print()}
      />
      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Studio views"
          className="flex w-11 shrink-0 flex-col items-center gap-2 border-r bg-card py-3 print:hidden"
        >
          <ToolBtn label="Report view" active={!showData} onClick={() => setShowData(false)}>
            <BarChart3 className="size-4" />
          </ToolBtn>
          <ToolBtn label="Data view" active={showData} onClick={() => setShowData((v) => !v)}>
            <Table2 className="size-4" />
          </ToolBtn>
          <ToolBtn
            label="Layers"
            active={showLayers}
            onClick={() => {
              setShowLayers((v) => !v);
              setLeft("layers");
            }}
          >
            <Layers className="size-4" />
          </ToolBtn>
          <ToolBtn label="Filters" active={showFilters} onClick={() => setShowFilters((v) => !v)}>
            <Filter className="size-4" />
          </ToolBtn>
          <ToolBtn
            label="Toggle editing panels"
            active={showInspector}
            onClick={() => setShowInspector((v) => !v)}
          >
            <SlidersHorizontal className="size-4" />
          </ToolBtn>
        </nav>
        {/* Left panel */}
        {showLayers && (
          <aside className="absolute bottom-9 left-11 top-[172px] z-30 flex w-60 flex-col border-r bg-card shadow-card print:hidden">
            <div className="flex border-b p-1 text-xs font-semibold">
              {(
                [
                  ["components", Plus],
                  ["layers", Layers],
                  ["versions", History],
                ] as const
              ).map(([k, I]) => (
                <Button
                  variant="ghost"
                  key={k}
                  onClick={() => setLeft(k)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 capitalize ${left === k ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
                >
                  <I className="h-3.5 w-3.5" />
                  {k}
                </Button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-3">
              {left === "components" && (
                <div className="grid grid-cols-2 gap-2">
                  {LIBRARY.map((c) => (
                    <Button
                      variant="ghost"
                      key={c.type}
                      onClick={() => addW(c.type, c.w, c.h, c.label)}
                      className="flex h-auto flex-col items-center gap-1.5 rounded-md border p-3 text-[11px] font-semibold transition hover:border-primary hover:bg-accent"
                    >
                      <c.icon className="h-5 w-5 text-primary" />
                      {c.label}
                    </Button>
                  ))}
                </div>
              )}
              {left === "layers" && (
                <ul className="space-y-1">
                  {d.widgets.map((w, i) => (
                    <li
                      key={w.id}
                      className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs ${sel === w.id ? "bg-accent text-accent-foreground" : "hover:bg-secondary"}`}
                    >
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSel(w.id);
                          setRight("format");
                        }}
                        className="flex-1 truncate text-left"
                      >
                        <span className="mr-1 text-muted-foreground">{w.type}</span>
                        {w.title}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => moveW(w.id, -1)}
                        disabled={i === 0}
                        className="opacity-0 group-hover:opacity-100 disabled:opacity-20"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => moveW(w.id, 1)}
                        disabled={i === d.widgets.length - 1}
                        className="opacity-0 group-hover:opacity-100 disabled:opacity-20"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {left === "versions" && (
                <div className="space-y-2 text-xs">
                  <Button
                    variant="ghost"
                    onClick={saveVersion}
                    className="w-full rounded-lg bg-primary py-2 font-semibold text-primary-foreground"
                  >
                    Save current version
                  </Button>
                  {!d.versions?.length && (
                    <p className="text-muted-foreground">No saved versions yet.</p>
                  )}
                  {d.versions?.map((v) => (
                    <div
                      key={v.at}
                      className="flex items-center justify-between rounded-lg border p-2"
                    >
                      <div>
                        <p className="font-semibold">{v.label}</p>
                        <p className="text-muted-foreground">{new Date(v.at).toLocaleString()}</p>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          set({ ...d, widgets: v.widgets, theme: v.theme });
                          toast.success(`Restored ${v.label}`);
                        }}
                        className="font-semibold text-primary"
                      >
                        Restore
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Canvas */}
        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex-1 overflow-auto p-4 md:p-6" onClick={() => setSel(null)}>
            {filters.length > 0 && (
              <Button
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  setDRaw({ ...d, filters: {} });
                }}
                className="mb-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground print:hidden"
              >
                <FilterX className="h-3.5 w-3.5" /> Filtered by{" "}
                {filters.map(([k, v]) => `${k}: ${v}`).join(", ")} — clear
              </Button>
            )}
            <div
              className={`dashboard-report report-${d.design ?? "default"} report-sheet mx-auto min-h-[560px] max-w-6xl p-5`}
              style={{ background: t.bg, zoom: zoom / 100 }}
            >
              <ReportHeading d={d} />
              <div className="report-grid grid grid-cols-1 gap-3 md:grid-cols-12">
                {d.widgets.map((w) => (
                  <div
                    key={w.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSel(w.id);
                      setRight("format");
                      setShowInspector(true);
                    }}
                    data-widget-type={w.type}
                    className={`report-tile report-visual group relative !overflow-visible ${spanClass(w.w)} cursor-pointer p-3 transition ${sel === w.id ? "report-visual-selected ring-1 ring-primary" : "hover:ring-1 hover:ring-primary/50"}`}
                    style={{
                      background: t.card,
                      border: `1px solid ${t.border}`,
                      height: heightPx(w.h),
                    }}
                  >
                    <WidgetView w={w} d={d} onFilter={onFilter} />
                    {sel === w.id && (
                      <div
                        className="absolute -top-3 right-2 z-10 flex gap-0.5 rounded-lg border bg-card p-0.5 shadow-card print:hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ToolBtn small onClick={() => moveW(w.id, -1)} label="Move earlier">
                          <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                        </ToolBtn>
                        <ToolBtn small onClick={() => moveW(w.id, 1)} label="Move later">
                          <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                        </ToolBtn>
                        <ToolBtn small onClick={() => dupW(w.id)} label="Duplicate">
                          <Copy className="h-3.5 w-3.5" />
                        </ToolBtn>
                        <ToolBtn small onClick={() => removeW(w.id)} label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </ToolBtn>
                      </div>
                    )}
                  </div>
                ))}
                {!d.widgets.length && (
                  <div className="col-span-12 grid place-items-center py-20 text-center">
                    <div>
                      <p className="font-display font-semibold" style={{ color: t.fg }}>
                        Start with a visual
                      </p>
                      <p className="mt-1 text-sm" style={{ color: t.muted }}>
                        Pick a chart, KPI or table to add your first component.
                      </p>
                      <div className="mt-4 flex flex-wrap justify-center gap-2">
                        {LIBRARY.slice(0, 6).map((c) => (
                          <Button
                            key={c.type}
                            onClick={(e) => {
                              e.stopPropagation();
                              addW(c.type, c.w, c.h, c.label);
                            }}
                            className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-xs font-semibold shadow-card hover:border-primary"
                          >
                            <c.icon className="h-4 w-4 text-primary" />
                            {c.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          {showData && <DataGrid d={d} set={set} />}
          <div className="flex h-9 shrink-0 items-center border-t bg-card text-[11px] print:hidden">
            <span className="flex h-full items-center gap-2 border-r border-t-2 border-t-primary bg-accent px-4 font-semibold">
              <LayoutDashboard className="size-3" /> Overview
            </span>
            <span className="hidden px-3 text-muted-foreground sm:block">
              {d.widgets.length} visuals · {d.dataset.rows.length.toLocaleString()} rows
            </span>
            <div className="ml-auto flex items-center gap-2 pr-2">
              <ToolBtn small label="Zoom out" onClick={() => setZoom(Math.max(50, zoom - 10))}>
                <Minus className="size-3" />
              </ToolBtn>
              <input
                aria-label="Canvas zoom"
                type="range"
                min={50}
                max={150}
                step={10}
                value={zoom}
                onChange={(e) => setZoom(+e.target.value)}
                className="w-16 accent-primary sm:w-24"
              />
              <ToolBtn small label="Zoom in" onClick={() => setZoom(Math.min(150, zoom + 10))}>
                <Plus className="size-3" />
              </ToolBtn>
              <span className="w-9 text-center text-muted-foreground">{zoom}%</span>
              <ToolBtn small label="Reset zoom" onClick={() => setZoom(100)}>
                <Maximize2 className="size-3" />
              </ToolBtn>
            </div>
          </div>
        </main>

        {showFilters && (
          <aside className="absolute bottom-9 right-0 top-[172px] z-40 w-56 overflow-auto border-l bg-card shadow-card lg:static lg:w-48 print:hidden">
            <div className="pane-heading">
              Filters
              <ToolBtn small label="Close filters" onClick={() => setShowFilters(false)}>
                <PanelRightClose className="size-3" />
              </ToolBtn>
            </div>
            <div className="space-y-4 p-3">
              <p className="text-[11px] font-semibold text-muted-foreground">
                Filters on this report
              </p>
              {categoryColumns(d.dataset).map((col) => (
                <Field key={col} label={col}>
                  <select
                    aria-label={`Filter ${col}`}
                    value={String(d.filters[col] ?? "")}
                    onChange={(e) => {
                      const next = { ...d.filters };
                      if (e.target.value) next[col] = e.target.value;
                      else delete next[col];
                      setDRaw({ ...d, filters: next });
                    }}
                    className={inputCls}
                  >
                    <option value="">All</option>
                    {[...new Set(d.dataset.rows.map((r) => String(r[col])))].map((val) => (
                      <option key={val}>{val}</option>
                    ))}
                  </select>
                </Field>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setDRaw({ ...d, filters: {} })}
              >
                <FilterX />
                Clear filters
              </Button>
            </div>
          </aside>
        )}
        {showInspector && (
          <aside className="absolute bottom-9 right-0 top-[172px] z-30 flex w-64 shrink-0 flex-col border-l bg-card shadow-card md:static md:shadow-none print:hidden">
            <div className="pane-heading">
              Visualizations
              <ToolBtn small label="Close editing panels" onClick={() => setShowInspector(false)}>
                <PanelRightClose className="size-3" />
              </ToolBtn>
            </div>
            <div className="flex border-b px-2 py-1">
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 text-[11px] ${right === "format" ? "bg-accent text-primary" : "text-muted-foreground"}`}
                onClick={() => setRight("format")}
              >
                <Paintbrush />
                Build visual
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`flex-1 text-[11px] ${right === "ai" ? "bg-accent text-primary" : "text-muted-foreground"}`}
                onClick={() => setRight("ai")}
              >
                <Sparkles />
                Copilot
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-3">
              {right === "ai" ? (
                <Copilot d={d} set={set} />
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-4 gap-1">
                    {LIBRARY.map((v) => (
                      <Button
                        key={v.type}
                        variant="ghost"
                        title={selected ? `Change to ${v.label}` : `Add ${v.label}`}
                        aria-label={selected ? `Change to ${v.label}` : `Add ${v.label}`}
                        aria-pressed={selected?.type === v.type}
                        className={`visual-selector ${selected?.type === v.type ? "bg-accent text-primary ring-1 ring-primary" : "text-muted-foreground"}`}
                        onClick={() =>
                          selected
                            ? updW(selected.id, { type: v.type, h: v.h })
                            : addW(v.type, v.w, v.h, v.label)
                        }
                      >
                        <v.icon />
                      </Button>
                    ))}
                  </div>
                  <div className="mb-3 flex items-center justify-between border-b pb-2 text-[11px] font-semibold">
                    <span>{selected ? "Selected visual" : "Report settings"}</span>
                    <span className="text-muted-foreground">{selected?.type ?? "Overview"}</span>
                  </div>
                  {selected ? (
                    <Props w={selected} d={d} upd={(p) => updW(selected.id, p)} />
                  ) : (
                    <div className="space-y-4">
                      <Field label="Report theme">
                        <select
                          aria-label="Report theme"
                          value={d.theme}
                          onChange={(e) =>
                            set({ ...d, theme: e.target.value as ThemeId, design: undefined })
                          }
                          className={inputCls}
                        >
                          {Object.entries(THEMES).map(([id, theme]) => (
                            <option key={id} value={id}>
                              {theme.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="flex items-center gap-2 border-b pb-3 text-[11px] text-muted-foreground">
                        <Database className="size-4" />
                        {d.dataset.name}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {d.widgets.length} visuals · {d.dataset.columns.length} fields
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </aside>
        )}
        {showInspector && (
          <aside className="hidden w-44 shrink-0 flex-col border-l bg-card xl:flex print:hidden">
            <div className="pane-heading">
              Data
              <Database className="size-3 text-muted-foreground" />
            </div>
            <label className="m-2 flex items-center gap-1.5 rounded border px-2 py-1.5">
              <Search className="size-3 shrink-0 text-muted-foreground" />
              <input
                aria-label="Search fields"
                value={fieldSearch}
                onChange={(e) => setFieldSearch(e.target.value)}
                placeholder="Search fields"
                className="min-w-0 bg-transparent text-[11px] outline-none"
              />
            </label>
            <Button
              variant="ghost"
              onClick={() => setDataExpanded((v) => !v)}
              className="h-9 justify-start gap-1 px-2 text-[11px]"
              aria-expanded={dataExpanded}
            >
              {dataExpanded ? <ChevronDown /> : <ChevronRight />}
              <Table2 />
              <span className="truncate">{d.dataset.name}</span>
            </Button>
            {dataExpanded && (
              <div className="overflow-auto px-2">
                {d.dataset.columns
                  .filter((col) => col.toLowerCase().includes(fieldSearch.toLowerCase()))
                  .map((col) => {
                    const numeric = numericColumns(d.dataset).includes(col);
                    const assigned = selected?.metric === col || selected?.dimension === col;
                    return (
                      <Button
                        key={col}
                        variant="ghost"
                        disabled={!selected}
                        title={selected ? `Assign ${col} to selected visual` : col}
                        onClick={() =>
                          selected &&
                          updW(
                            selected.id,
                            numeric
                              ? { metric: assigned ? undefined : col }
                              : { dimension: assigned ? undefined : col },
                          )
                        }
                        className="h-8 w-full justify-start gap-1.5 px-1 text-[11px]"
                      >
                        {assigned ? (
                          <CheckSquare className="size-3 text-primary" />
                        ) : (
                          <Square className="size-3 text-muted-foreground" />
                        )}
                        {numeric ? (
                          <Sigma className="size-3 text-muted-foreground" />
                        ) : (
                          <Type className="size-3 text-muted-foreground" />
                        )}
                        <span className="truncate">{col}</span>
                      </Button>
                    );
                  })}
              </div>
            )}
            <div className="mt-auto border-t p-3 text-[10px] text-muted-foreground">
              {d.dataset.rows.length.toLocaleString()} rows · {d.dataset.columns.length} fields
            </div>
          </aside>
        )}
      </div>

      {shareOpen && (
        <ShareDialog
          d={d}
          onClose={() => setShareOpen(false)}
          onPublish={() => set({ ...d, published: true })}
        />
      )}
    </div>
  );
}

function Canvas({ d, onFilter }: { d: Dashboard; onFilter: (c: string, v: Cell) => void }) {
  const t = reportTheme(d);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      {d.widgets.map((w) => (
        <div
          key={w.id}
          className={`${spanClass(w.w)} rounded-xl p-3`}
          style={{ background: t.card, border: `1px solid ${t.border}`, height: heightPx(w.h) }}
        >
          <WidgetView w={w} d={d} onFilter={onFilter} />
        </div>
      ))}
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  disabled,
  label,
  active,
  small,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  label: string;
  active?: boolean;
  small?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`rounded-md ${small ? "p-1" : "p-2"} text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:opacity-30 ${active ? "bg-accent text-accent-foreground" : ""}`}
    >
      {children}
    </Button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
const inputCls =
  "w-full rounded-lg border bg-background px-2.5 py-1.5 text-sm outline-none focus:border-primary";

function Props({ w, d, upd }: { w: Widget; d: Dashboard; upd: (p: Partial<Widget>) => void }) {
  const nums = numericColumns(d.dataset),
    cats = categoryColumns(d.dataset);
  const palette = THEMES[d.theme].palette;
  const chart = !["kpi", "table", "insight"].includes(w.type);
  return (
    <div className="space-y-4">
      <Field label="Title">
        <input
          value={w.title}
          onChange={(e) => upd({ title: e.target.value })}
          className={inputCls}
        />
      </Field>
      <Field label="Type">
        <select
          value={w.type}
          onChange={(e) =>
            upd({
              type: e.target.value as WidgetType,
              h: e.target.value === "kpi" ? 1 : Math.max(w.h, 2),
            })
          }
          className={inputCls}
        >
          {LIBRARY.map((l) => (
            <option key={l.type} value={l.type}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>
      {w.type === "insight" && (
        <Field label="Text">
          <textarea
            value={w.text ?? ""}
            onChange={(e) => upd({ text: e.target.value })}
            rows={4}
            className={inputCls}
          />
        </Field>
      )}
      {w.type === "kpi" && (
        <Field label="Number format">
          <select
            value={w.format ?? "number"}
            onChange={(e) => upd({ format: e.target.value as Widget["format"] })}
            className={inputCls}
          >
            <option value="number">Number (1.2K)</option>
            <option value="currency">Currency ($1.2K)</option>
            <option value="percent">Percent (12.0%)</option>
            <option value="minutes">Minutes (45 min)</option>
            <option value="rating">Rating (★ 4.5)</option>
          </select>
        </Field>
      )}
      {w.type !== "table" && w.type !== "insight" && (
        <>
          <Field label="Y-axis / Values">
            <select
              value={w.metric}
              onChange={(e) => upd({ metric: e.target.value })}
              className={inputCls}
            >
              {nums.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Aggregation">
            <select
              value={w.agg}
              onChange={(e) => upd({ agg: e.target.value as Widget["agg"] })}
              className={inputCls}
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
            </select>
          </Field>
        </>
      )}
      {chart && (
        <Field label="X-axis / Category">
          <select
            value={w.dimension}
            onChange={(e) => upd({ dimension: e.target.value })}
            className={inputCls}
          >
            {cats.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      )}
      <Field label={`Width · ${w.w}/12`}>
        <input
          type="range"
          min={2}
          max={12}
          step={1}
          value={w.w}
          onChange={(e) =>
            upd({
              w: [2, 3, 4, 5, 6, 7, 8, 9, 12].reduce((a, b) =>
                Math.abs(b - +e.target.value) < Math.abs(a - +e.target.value) ? b : a,
              ),
            })
          }
          className="w-full accent-primary"
        />
      </Field>
      <Field label={`Height · ${w.h}`}>
        <input
          type="range"
          min={1}
          max={3}
          value={w.h}
          onChange={(e) => upd({ h: +e.target.value })}
          className="w-full accent-primary"
        />
      </Field>
      <Field label="Color">
        <div className="flex gap-2">
          {palette.map((c, i) => (
            <Button
              variant="ghost"
              key={i}
              onClick={() => upd({ color: i })}
              aria-label={`Color ${i + 1}`}
              className={`h-7 w-7 rounded-full ${w.color === i ? "ring-2 ring-foreground ring-offset-2" : ""}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

function Copilot({ d, set }: { d: Dashboard; set: (n: Dashboard) => void }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState<{ role: "you" | "ai"; text: string }[]>([]);
  async function send(text: string) {
    if (text.trim().length < 2 || busy) return;
    setLog((l) => [...l, { role: "you", text }]);
    setQ("");
    setBusy(true);
    try {
      const res = await api<unknown>("/api/ai/edit", {
        method: "POST",
        body: {
          instruction: text,
          columns: d.dataset.columns,
          theme: d.theme,
          widgets: d.widgets,
        },
      });
      if (!res.ok) throw new Error(res.message ?? res.error);
      {
        const out = res.data as { theme?: string; widgets?: unknown; summary?: string };
        const widgets = sanitizeWidgets(out.widgets, d.dataset);
        if (!widgets.length) {
          setLog((l) => [
            ...l,
            { role: "ai", text: "I couldn't produce a valid layout for that. Try rephrasing." },
          ]);
          return;
        }
        set({ ...d, theme: sanitizeTheme(out.theme ?? d.theme), widgets });
        setLog((l) => [
          ...l,
          { role: "ai", text: (out.summary || "Done.") + " (Undo with Ctrl+Z)" },
        ]);
        return;
      }
    } catch {
      const demo = demoEdit(text, d);
      if (demo) {
        set(demo.dashboard);
        setLog((l) => [
          ...l,
          {
            role: "ai",
            text: demo.summary + " Live AI needs sign-in + a configured server provider.",
          },
        ]);
      } else {
        setLog((l) => [
          ...l,
          {
            role: "ai",
            text: "Live AI is unavailable and I can't do that locally. Try: “switch to a dark theme”, “simplify to 6 widgets”, “add an insight”, or “add a KPI”.",
          },
        ]);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="rounded-xl bg-accent p-3 text-xs text-accent-foreground">
        <Sparkles className="mb-1 h-4 w-4" />
        Tell me how to change this dashboard — layout, charts, theme or insights.
      </div>
      <div className="flex flex-wrap gap-1.5">
        {COPILOT.map((c) => (
          <Button
            variant="ghost"
            key={c}
            disabled={busy}
            onClick={() => send(c)}
            className="rounded-full border px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:border-primary hover:text-foreground disabled:opacity-50"
          >
            {c}
          </Button>
        ))}
      </div>
      <div className="flex-1 space-y-2 overflow-auto text-sm">
        {log.map((m, i) => (
          <p
            key={i}
            className={
              m.role === "you"
                ? "ml-6 rounded-xl bg-primary px-3 py-2 text-primary-foreground"
                : "flex gap-2"
            }
          >
            {m.role === "ai" && <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-primary" />}
            {m.text}
          </p>
        ))}
        {busy && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Redesigning…
          </p>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(q);
        }}
        className="flex items-center gap-1 rounded-xl border p-1"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask the copilot…"
          className="min-w-0 flex-1 bg-transparent px-2 text-sm outline-none"
        />
        <Button
          variant="ghost"
          disabled={busy}
          className="rounded-lg bg-gradient-primary p-2 text-primary-foreground disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function DataGrid({ d, set }: { d: Dashboard; set: (n: Dashboard) => void }) {
  const [name, setName] = useState("");
  const [formula, setFormula] = useState("");
  const nums = numericColumns(d.dataset);
  const editCell = (i: number, c: string, v: string) => {
    const rows = [...d.dataset.rows];
    const n = Number(v);
    rows[i] = { ...rows[i], [c]: v !== "" && !Number.isNaN(n) && nums.includes(c) ? n : v };
    set({ ...d, dataset: { ...d.dataset, rows } });
  };
  const addCalc = () => {
    const col = name.trim();
    if (!col || d.dataset.columns.includes(col))
      return toast.error("Give the new column a unique name.");
    try {
      const rows = d.dataset.rows.map((r) => {
        const expr = formula.replace(/\[([^\]]+)\]/g, (_, c) => {
          if (!nums.includes(c)) throw new Error(`Unknown numeric column "${c}"`);
          return `(${Number(r[c]) || 0})`;
        });
        if (!/^[\d\s+\-*/().]+$/.test(expr))
          throw new Error("Use only [Column] names, numbers and + - * / ( )");
        const v = Function(`"use strict";return (${expr})`)() as number;
        return { ...r, [col]: Number.isFinite(v) ? Math.round(v * 100) / 100 : 0 };
      });
      set({ ...d, dataset: { ...d.dataset, columns: [...d.dataset.columns, col], rows } });
      toast.success(`Added calculated column "${col}"`);
      setName("");
      setFormula("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <div className="flex h-72 shrink-0 flex-col border-t bg-card print:hidden">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2 text-xs">
        <span className="font-semibold">
          {d.dataset.name} · {d.dataset.rows.length} rows
        </span>
        <span className="ml-auto text-muted-foreground">Calculated column:</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-28 rounded-md border px-2 py-1"
        />
        <input
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder={nums.length > 1 ? `[${nums[0]}] - [${nums[1]}]` : "[Column] * 2"}
          className="w-56 rounded-md border px-2 py-1 font-mono"
        />
        <Button
          variant="ghost"
          onClick={addCalc}
          className="rounded-md bg-primary px-2.5 py-1 font-semibold text-primary-foreground"
        >
          Add
        </Button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="text-xs">
          <thead className="sticky top-0 z-10 bg-secondary">
            <tr>
              <th className="w-10 border-r px-2 py-1 text-muted-foreground">#</th>
              {d.dataset.columns.map((c) => (
                <th key={c} className="min-w-28 border-r px-2 py-1 text-left font-semibold">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {d.dataset.rows.slice(0, 200).map((r, i) => (
              <tr key={i} className="border-t">
                <td className="border-r px-2 text-center text-muted-foreground">{i + 1}</td>
                {d.dataset.columns.map((c) => (
                  <td key={c} className="border-r p-0">
                    <input
                      defaultValue={String(r[c] ?? "")}
                      onBlur={(e) =>
                        e.target.value !== String(r[c] ?? "") && editCell(i, c, e.target.value)
                      }
                      className="w-full bg-transparent px-2 py-1 outline-none focus:bg-accent"
                    />
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

function ShareDialog({
  d,
  onClose,
  onPublish,
}: {
  d: Dashboard;
  onClose: () => void;
  onPublish: () => void;
}) {
  const url = typeof window !== "undefined" ? `${window.location.origin}/view/${d.id}` : "";
  const embed = `<iframe src="${url}" width="100%" height="720" style="border:0"></iframe>`;
  const copy = (s: string) => {
    navigator.clipboard.writeText(s);
    toast.success("Copied");
  };
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-float"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Share dashboard</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {d.published
            ? "Published — anyone with the link on this device can view it."
            : "Publish to get an interactive share link."}
        </p>
        {!d.published ? (
          <Button
            variant="ghost"
            onClick={onPublish}
            className="mt-5 w-full rounded-xl bg-gradient-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Publish now
          </Button>
        ) : (
          <div className="mt-5 space-y-3">
            <Field label="Link">
              <div className="flex gap-2">
                <input readOnly value={url} className={inputCls} />
                <Button
                  variant="ghost"
                  onClick={() => copy(url)}
                  className="rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
                >
                  Copy
                </Button>
              </div>
            </Field>
            <Field label="Embed">
              <div className="flex gap-2">
                <input readOnly value={embed} className={inputCls + " font-mono text-xs"} />
                <Button
                  variant="ghost"
                  onClick={() => copy(embed)}
                  className="rounded-lg border px-3 text-xs font-semibold"
                >
                  Copy
                </Button>
              </div>
            </Field>
            <Link
              to="/view/$id"
              params={{ id: d.id }}
              className="block text-center text-sm font-semibold text-primary"
            >
              Open shared view →
            </Link>
          </div>
        )}
        <p className="mt-4 rounded-lg bg-secondary p-2.5 text-[11px] text-muted-foreground">
          Dashboards are saved on this device for now. Real-time team sharing arrives when accounts
          are added.
        </p>
        <Button
          variant="ghost"
          onClick={onClose}
          className="mt-3 w-full text-sm font-semibold text-muted-foreground"
        >
          Close
        </Button>
      </div>
    </div>
  );
}
