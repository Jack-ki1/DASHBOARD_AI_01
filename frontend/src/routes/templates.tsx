import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { REPORT_DESIGNS } from "@/lib/report-designs";
import { Search } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DashboardCanvas } from "@/components/Widget";
import { TEMPLATES, THEMES, dashboardFromTemplate, type Template } from "@/lib/dashboard";
import { projects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/templates")({
  component: Templates,
});

function Card({ t, onUse }: { t: Template; onUse: () => void }) {
  const d = useMemo(() => {
    const x = dashboardFromTemplate(t);
    return { ...x, widgets: x.widgets.map((w, i) => ({ ...w, id: `${t.id}${i}` })) };
  }, [t]);
  return (
    <div className="group overflow-hidden rounded-lg border bg-card shadow-card">
      <div className="pointer-events-none relative h-64 overflow-hidden border-b">
        <div className="origin-top-left scale-[0.5]" style={{ width: "200%" }}>
          <DashboardCanvas d={d} compact />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-4">
        <div className="min-w-0">
          <p className="font-semibold">{t.name}</p>
          <p className="text-xs text-muted-foreground">
            {t.category} · {REPORT_DESIGNS[t.design].layout}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {d.widgets.length} visuals · {THEMES[t.theme].label} theme · synthetic sample data
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
            {t.tag}
          </span>
          <Button
            size="sm"
            aria-label={`Use ${t.name}`}
            onClick={onUse}
            className="rounded-lg bg-gradient-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Use
          </Button>
        </div>
      </div>
    </div>
  );
}

function Templates() {
  useTitle("Template Marketplace — DASHBOARD AI");
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [tag, setTag] = useState("All tags");
  const [sort, setSort] = useState<"featured" | "name" | "category">("featured");
  const cats = ["All", ...new Set(TEMPLATES.map((t) => t.category))];
  const tags = ["All tags", ...new Set(TEMPLATES.map((t) => t.tag))];
  const query = q.trim().toLowerCase();
  const list = TEMPLATES.filter(
    (t) =>
      (cat === "All" || t.category === cat) &&
      (tag === "All tags" || t.tag === tag) &&
      (!query || `${t.name} ${t.category} ${t.tag}`.toLowerCase().includes(query)),
  );
  const ordered =
    sort === "name"
      ? [...list].sort((a, b) => a.name.localeCompare(b.name))
      : sort === "category"
        ? [...list].sort(
            (a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
          )
        : list;
  const use = (t: Template) => {
    const d = dashboardFromTemplate(t);
    projects.save(d);
    nav({ to: "/studio/$id", params: { id: d.id } });
  };
  return (
    <div className="min-h-screen">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-5 py-12">
        <h1 className="text-4xl font-bold">Premium templates for every use case</h1>
        <p className="mt-2 text-muted-foreground">
          Every template opens in the Studio, ready to customize.
        </p>
        <div className="mt-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <label className="flex w-full items-center gap-2 rounded-xl border bg-card px-3 py-2 md:w-72">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search templates…"
                aria-label="Search templates"
                className="w-full bg-transparent text-sm outline-none"
              />
            </label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              aria-label="Filter by tag"
              className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold md:ml-auto"
            >
              {tags.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "featured" | "name" | "category")}
              aria-label="Sort templates"
              className="rounded-lg border bg-card px-2.5 py-1.5 text-xs font-semibold"
            >
              <option value="featured">Featured</option>
              <option value="name">Name A–Z</option>
              <option value="category">Category</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {cats.map((c) => (
              <Button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${cat === c ? "bg-primary text-primary-foreground" : "border bg-card text-muted-foreground hover:text-foreground"}`}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {ordered.length} of {TEMPLATES.length} templates · previews render live from synthetic
          sample data
        </p>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ordered.map((t) => (
            <Card key={t.id} t={t} onUse={() => use(t)} />
          ))}
          {!ordered.length && (
            <p className="text-muted-foreground">No templates match your search.</p>
          )}
        </div>
      </div>
    </div>
  );
}
