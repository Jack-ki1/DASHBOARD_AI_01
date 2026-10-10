import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Download, FilterX, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/AppHeader";
import { DashboardCanvas } from "@/components/Widget";
import type { Dashboard } from "@/lib/dashboard";
import { projects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/view/$id")({
  component: View,
});

function View() {
  useTitle("Shared dashboard — DASHBOARD AI");
  const { id } = Route.useParams();
  const nav = useNavigate();
  const [d, setD] = useState<Dashboard | null | undefined>(undefined);
  useEffect(() => {
    let cancelled = false;
    projects.fetch(id).then((found) => {
      if (!cancelled) setD(found);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);
  if (d === undefined)
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  if (!d)
    return (
      <div className="grid min-h-screen place-items-center px-4 text-center text-muted-foreground">
        <div>
          <p className="font-semibold text-foreground">This dashboard isn't available.</p>
          <p className="mt-1 text-sm">It may be unpublished, deleted, or on another device.</p>
          <Link to="/workspace" className="mt-4 inline-block text-sm font-semibold text-primary">
            Back to workspace
          </Link>
        </div>
      </div>
    );
  const isLocal = projects.get(id) !== undefined;
  const openInStudio = () => {
    if (!projects.get(id)) {
      projects.save({ ...d, published: false });
      toast.success("Saved a copy to your workspace.");
    }
    nav({ to: "/studio/$id", params: { id } });
  };
  const filters = Object.entries(d.filters);
  return (
    <div className="min-h-screen bg-secondary">
      <header className="flex items-center justify-between border-b bg-card px-5 py-3">
        <div className="flex items-center gap-4">
          <Logo />
          <span className="font-display font-semibold">{d.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
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
            }}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> CSV
          </button>
          {!isLocal && (
            <button
              onClick={openInStudio}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold"
            >
              <Copy className="h-4 w-4" /> Save a copy
            </button>
          )}
          <button
            onClick={openInStudio}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl p-5">
        {filters.length > 0 && (
          <button
            onClick={() => setD({ ...d, filters: {} })}
            className="mb-3 flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground"
          >
            <FilterX className="h-3.5 w-3.5" /> {filters.map(([k, v]) => `${k}: ${v}`).join(", ")} —
            clear
          </button>
        )}
        <DashboardCanvas
          d={d}
          onFilter={(c, v) =>
            setD({ ...d, filters: d.filters[c] === v ? {} : { ...d.filters, [c]: v } })
          }
        />
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Tip: click a bar or slice to filter the whole dashboard.
        </p>
      </main>
    </div>
  );
}
