import { useState } from "react";
import {
  AreaChart,
  BarChart3,
  Copy,
  Database,
  Download,
  Eye,
  FileInput,
  Gauge,
  History,
  Layers,
  LayoutDashboard,
  Lightbulb,
  LineChart,
  Paintbrush,
  PieChart,
  Plus,
  Redo2,
  Sparkles,
  Table2,
  Trash2,
  Undo2,
  Filter,
  ChartNoAxesCombined,
  ChartBar,
  ChartColumnStacked,
  CircleDot,
  Grid3X3,
  Radar,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeId, type WidgetType } from "@/lib/dashboard";

export const VISUALS = [
  { type: "kpi", label: "KPI card", icon: Gauge, w: 3, h: 1 },
  { type: "line", label: "Line chart", icon: LineChart, w: 6, h: 2 },
  { type: "area", label: "Area chart", icon: AreaChart, w: 6, h: 2 },
  { type: "bar", label: "Bar chart", icon: BarChart3, w: 6, h: 2 },
  { type: "donut", label: "Donut", icon: PieChart, w: 4, h: 2 },
  { type: "funnel", label: "Funnel", icon: Filter, w: 4, h: 2 },
  { type: "table", label: "Table", icon: Table2, w: 6, h: 2 },
  { type: "insight", label: "Insight card", icon: Lightbulb, w: 4, h: 1 },
  { type: "sparkline", label: "Sparkline", icon: ChartNoAxesCombined, w: 4, h: 1 },
  { type: "horizontal", label: "Ranking bars", icon: ChartBar, w: 6, h: 2 },
  { type: "stacked", label: "Stacked bars", icon: ChartColumnStacked, w: 8, h: 2 },
  { type: "radial", label: "Share rings", icon: CircleDot, w: 4, h: 2 },
  { type: "heatmap", label: "Heatmap", icon: Grid3X3, w: 8, h: 2 },
  { type: "radar", label: "Radar", icon: Radar, w: 4, h: 2 },
] satisfies { type: WidgetType; label: string; icon: typeof Gauge; w: number; h: number }[];

type Props = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  add: (type: WidgetType, w: number, h: number, label: string) => void;
  data: () => void;
  copilot: () => void;
  preview: () => void;
  versions: () => void;
  layers: () => void;
  duplicate: () => void;
  remove: () => void;
  selected: boolean;
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  exportCsv: () => void;
  exportJson: () => void;
  print: () => void;
};

export function StudioRibbon(p: Props) {
  const [tab, setTab] = useState("Home");
  const action = (label: string, Icon: typeof Gauge, onClick: () => void, disabled = false) => (
    <Button
      key={label}
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className="ribbon-action"
      title={label}
    >
      <Icon className="size-5" />
      <span>{label}</span>
    </Button>
  );
  const visuals =
    tab === "Insert"
      ? VISUALS
      : VISUALS.filter((v) => ["bar", "line", "kpi", "table"].includes(v.type));
  return (
    <div className="studio-ribbon shrink-0 border-b bg-card print:hidden">
      <nav aria-label="Report ribbon" className="flex items-center gap-1 border-b px-3">
        {["Home", "Insert", "Design", "View"].map((name) => (
          <Button
            key={name}
            variant="ghost"
            role="tab"
            aria-selected={tab === name}
            onClick={() => setTab(name)}
            className={`ribbon-tab ${tab === name ? "ribbon-tab-active" : ""}`}
          >
            {name}
          </Button>
        ))}
        <span className="ml-auto hidden items-center gap-1.5 pr-2 text-[10px] font-medium text-muted-foreground sm:flex">
          <LayoutDashboard className="size-3" /> REPORT EDITOR
        </span>
      </nav>
      <div className="ribbon-content flex overflow-x-auto px-2">
        {tab === "Home" && (
          <>
            <RibbonGroup label="History">
              {action("Undo", Undo2, p.undo, !p.canUndo)}
              {action("Redo", Redo2, p.redo, !p.canRedo)}
            </RibbonGroup>
            <RibbonGroup label="Data">
              <Button asChild variant="ghost" className="ribbon-action">
                <Link to="/data">
                  <FileInput className="size-5" />
                  <span>Get data</span>
                </Link>
              </Button>
              {action("Data table", Database, p.data)}
            </RibbonGroup>
          </>
        )}
        {(tab === "Home" || tab === "Insert") && (
          <RibbonGroup label="Visualizations">
            {visuals.map((v) => action(v.label, v.icon, () => p.add(v.type, v.w, v.h, v.label)))}
          </RibbonGroup>
        )}
        {tab === "Home" && (
          <RibbonGroup label="Intelligence">{action("Copilot", Sparkles, p.copilot)}</RibbonGroup>
        )}
        {tab === "Insert" && (
          <RibbonGroup label="Selection">
            {action("Duplicate", Copy, p.duplicate, !p.selected)}
            {action("Delete", Trash2, p.remove, !p.selected)}
          </RibbonGroup>
        )}
        {tab === "Design" && (
          <RibbonGroup label="Report theme">
            <div className="flex max-w-2xl flex-wrap items-center gap-1 px-2">
              {Object.entries(THEMES).map(([id, theme]) => (
                <Button
                  key={id}
                  variant={p.theme === id ? "secondary" : "ghost"}
                  onClick={() => p.setTheme(id as ThemeId)}
                  className="flex h-12 flex-col gap-1 text-xs"
                >
                  <Paintbrush className="size-4" />
                  {theme.label}
                </Button>
              ))}
            </div>
          </RibbonGroup>
        )}
        {(tab === "Design" || tab === "View") && (
          <RibbonGroup label="Workspace">
            {action("Layers", Layers, p.layers)}
            {action("Versions", History, p.versions)}
            {action("Data table", Table2, p.data)}
          </RibbonGroup>
        )}
        {tab === "View" && (
          <RibbonGroup label="Presentation">
            {action("Preview", Eye, p.preview)}
            {action("PDF / Print", Download, p.print)}
            {action("Export CSV", Table2, p.exportCsv)}
            {action("Export JSON", Download, p.exportJson)}
          </RibbonGroup>
        )}
        <div className="ml-auto hidden items-center px-5 text-muted-foreground xl:flex">
          <span className="studio-ai-mark">
            <Sparkles className="size-5" />
          </span>
        </div>
      </div>
    </div>
  );
}

function RibbonGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex shrink-0 flex-col border-r px-2 pt-1">
      <div className="flex flex-1 items-center gap-0.5">{children}</div>
      <p className="pb-1 text-center text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
