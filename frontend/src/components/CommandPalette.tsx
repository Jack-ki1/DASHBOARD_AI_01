import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  FileSpreadsheet,
  Home,
  LayoutDashboard,
  LayoutTemplate,
  Search,
  Sparkles,
  FolderOpen,
} from "lucide-react";
import { TEMPLATES, dashboardFromTemplate } from "@/lib/dashboard";
import { projects, useProjects } from "@/lib/store";

type Item = {
  id: string;
  label: string;
  hint: string;
  icon: typeof Home;
  run: () => void;
};

export function CommandPalette() {
  const nav = useNavigate();
  const dashboards = useProjects();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);

  const items: Item[] = useMemo(() => {
    const go = (to: string) => () => {
      setOpen(false);
      nav({ to });
    };
    const all: Item[] = [
      {
        id: "new",
        label: "Create dashboard with AI",
        hint: "AI Builder",
        icon: Sparkles,
        run: go("/generate"),
      },
      {
        id: "templates",
        label: "Browse templates",
        hint: "Marketplace",
        icon: LayoutTemplate,
        run: go("/templates"),
      },
      {
        id: "data",
        label: "Import data (CSV / JSON)",
        hint: "Data",
        icon: FileSpreadsheet,
        run: go("/data"),
      },
      {
        id: "workspace",
        label: "Open workspace",
        hint: "Gallery",
        icon: FolderOpen,
        run: go("/workspace"),
      },
      { id: "home", label: "Go home", hint: "Overview", icon: Home, run: go("/") },
    ];
    dashboards
      .slice()
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, 5)
      .forEach((d) =>
        all.push({
          id: `open-${d.id}`,
          label: `Open “${d.name}”`,
          hint: "Recent dashboard",
          icon: LayoutDashboard,
          run: () => {
            setOpen(false);
            nav({ to: "/studio/$id", params: { id: d.id } });
          },
        }),
      );
    TEMPLATES.forEach((t) =>
      all.push({
        id: `tpl-${t.id}`,
        label: `Use template: ${t.name}`,
        hint: t.category,
        icon: LayoutTemplate,
        run: () => {
          const d = dashboardFromTemplate(t);
          projects.save(d);
          setOpen(false);
          nav({ to: "/studio/$id", params: { id: d.id } });
        },
      }),
    );
    return all;
  }, [dashboards, nav]);

  const query = q.trim().toLowerCase();
  const filtered = query
    ? items.filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(query))
    : items;
  const clamped = Math.min(active, Math.max(0, filtered.length - 1));

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 p-4 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="mx-auto mt-24 w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-float"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Command palette"
      >
        <label className="flex items-center gap-2 border-b px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, filtered.length - 1));
              }
              if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              }
              if (e.key === "Enter" && filtered[clamped]) filtered[clamped].run();
            }}
            placeholder="Search dashboards, templates, commands…"
            aria-label="Search commands and dashboards"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded border px-1.5 text-[10px] text-muted-foreground">ESC</kbd>
        </label>
        <ul className="max-h-80 overflow-auto p-2">
          {filtered.map((i, idx) => (
            <li key={i.id}>
              <button
                onClick={i.run}
                onMouseEnter={() => setActive(idx)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${idx === clamped ? "bg-accent" : ""}`}
              >
                <i.icon className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate font-medium">{i.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{i.hint}</span>
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No matches. Try “template”, “import” or a dashboard name.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
