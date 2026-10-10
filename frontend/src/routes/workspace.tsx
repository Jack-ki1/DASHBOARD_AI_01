import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Archive, Copy, ExternalLink, Plus, Search, Star, Trash2, Undo2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DashboardCanvas } from "@/components/Widget";
import { uid, type Dashboard } from "@/lib/dashboard";
import { projects, useProjects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/workspace")({
  component: Workspace,
});

const TABS = ["All", "Favorites", "Recent", "Published", "Drafts", "Archived"] as const;
type Tab = (typeof TABS)[number];

function matches(d: Dashboard, tab: Tab, q: string): boolean {
  if (q && !d.name.toLowerCase().includes(q)) return false;
  switch (tab) {
    case "Favorites":
      return !!d.favorite && !d.archived;
    case "Recent":
      return !d.archived;
    case "Published":
      return !!d.published && !d.archived;
    case "Drafts":
      return !d.published && !d.archived;
    case "Archived":
      return !!d.archived;
    default:
      return !d.archived;
  }
}

function Workspace() {
  useTitle("Workspace — DASHBOARD AI");
  const list = useProjects();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<Tab>("All");
  const [sort, setSort] = useState<"recent" | "name">("recent");
  const query = q.trim().toLowerCase();
  let visible = list.filter((d) => matches(d, tab, query));
  if (tab === "Recent")
    visible = [...visible].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8);
  else if (sort === "name") visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
  else visible = [...visible].sort((a, b) => b.updatedAt - a.updatedAt);
  const counts: Record<Tab, number> = {
    All: list.filter((d) => !d.archived).length,
    Favorites: list.filter((d) => d.favorite && !d.archived).length,
    Recent: Math.min(8, list.filter((d) => !d.archived).length),
    Published: list.filter((d) => d.published && !d.archived).length,
    Drafts: list.filter((d) => !d.published && !d.archived).length,
    Archived: list.filter((d) => d.archived).length,
  };
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-5 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold">Your dashboards</h1>
            <p className="mt-2 text-muted-foreground">
              Saved on this device
              {list.some((d) => d.published) ? " · cloud sync when signed in" : ""}.{" "}
              {list.filter((d) => !d.archived).length} active project
              {list.filter((d) => !d.archived).length === 1 ? "" : "s"}.
            </p>
          </div>
          <Link
            to="/generate"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow"
          >
            <Plus className="h-4 w-4" /> New
          </Link>
        </div>
        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 py-2 md:w-72">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search dashboards…"
              aria-label="Search dashboards"
              className="w-full bg-transparent text-sm outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Dashboard collections">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {t} · {counts[t]}
              </button>
            ))}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "recent" | "name")}
            aria-label="Sort dashboards"
            className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold md:ml-auto"
          >
            <option value="recent">Recently edited</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        {!visible.length ? (
          <div className="mt-10 surface grid place-items-center p-16 text-center">
            <p className="font-display text-lg font-semibold">
              {query || tab !== "All" ? "Nothing here" : "No dashboards yet"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {query || tab !== "All"
                ? "Try a different search or collection."
                : "Generate one with AI or start from a template."}
            </p>
            {!query && tab === "All" && (
              <div className="mt-5 flex gap-2">
                <Link
                  to="/generate"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  AI Builder
                </Link>
                <Link to="/templates" className="rounded-lg border px-4 py-2 text-sm font-semibold">
                  Templates
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((d) => (
              <div key={d.id} className="surface overflow-hidden">
                <Link
                  to="/studio/$id"
                  params={{ id: d.id }}
                  className="pointer-events-auto block h-48 overflow-hidden border-b"
                >
                  <div
                    className="pointer-events-none origin-top-left scale-[0.5]"
                    style={{ width: "200%" }}
                  >
                    <DashboardCanvas d={{ ...d, widgets: d.widgets }} compact />
                  </div>
                </Link>
                <div className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <Link
                      to="/studio/$id"
                      params={{ id: d.id }}
                      className="block truncate font-semibold hover:text-primary"
                    >
                      {d.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {d.published ? "Published · " : ""}
                      {d.description?.toLowerCase().includes("demo") ? "Demo · " : ""}Edited{" "}
                      {new Date(d.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1 text-muted-foreground">
                    <button
                      onClick={() => projects.save({ ...d, favorite: !d.favorite })}
                      className={`rounded-md p-1.5 hover:bg-secondary ${d.favorite ? "text-amber-500" : ""}`}
                      aria-label={d.favorite ? "Remove from favorites" : "Add to favorites"}
                      aria-pressed={!!d.favorite}
                    >
                      <Star className={`h-4 w-4 ${d.favorite ? "fill-current" : ""}`} />
                    </button>
                    <Link
                      to="/view/$id"
                      params={{ id: d.id }}
                      className="rounded-md p-1.5 hover:bg-secondary"
                      aria-label="View"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() =>
                        projects.save({ ...d, id: uid(), name: d.name + " copy", published: false })
                      }
                      className="rounded-md p-1.5 hover:bg-secondary"
                      aria-label="Duplicate"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    {d.archived ? (
                      <button
                        onClick={() => projects.save({ ...d, archived: false })}
                        className="rounded-md p-1.5 hover:bg-secondary"
                        aria-label="Restore from archive"
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => projects.save({ ...d, archived: true })}
                        className="rounded-md p-1.5 hover:bg-secondary"
                        aria-label="Archive"
                      >
                        <Archive className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => confirm(`Delete "${d.name}"?`) && projects.remove(d.id)}
                      className="rounded-md p-1.5 hover:bg-secondary hover:text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
