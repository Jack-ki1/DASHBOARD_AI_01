import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, FileSpreadsheet, Loader2, Sparkles, X } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { AppHeader } from "@/components/AppHeader";
import { api } from "@/lib/api";
import { DATASETS, uid, type Dataset } from "@/lib/dashboard";
import { demoGenerate } from "@/lib/demo-generate";
import { sanitizeTheme, sanitizeWidgets } from "@/lib/sanitize";
import { projects } from "@/lib/store";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/generate")({
  validateSearch: z.object({ prompt: z.string().optional() }),
  component: Generate,
});

const STEPS = [
  "Analyzing your request",
  "Selecting key metrics",
  "Building visualizations",
  "Adding insights",
  "Applying a theme",
];

function Generate() {
  useTitle("AI Builder — DASHBOARD AI");
  const { prompt: initial } = Route.useSearch();
  const nav = useNavigate();
  const [prompt, setPrompt] = useState(initial ?? "");
  const [data, setData] = useState<Dataset | null>(null);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const raw = sessionStorage.getItem("dashboard-ai:pending-dataset");
    if (raw) setData(JSON.parse(raw));
  }, []);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, [busy]);

  async function run() {
    if (prompt.trim().length < 3) return toast.error("Describe the dashboard you'd like.");
    setBusy(true);
    setStep(0);
    try {
      const res = await api<unknown>("/api/ai/generate", {
        method: "POST",
        body: {
          prompt,
          columns: data?.columns,
          sample: data ? JSON.stringify(data.rows.slice(0, 5)) : undefined,
        },
      });
      if (!res.ok) throw new Error(res.message ?? res.error);
      {
        const out = res.data as {
          name?: string;
          description?: string;
          theme?: string;
          dataset?: string;
          widgets?: unknown;
        };
        const dataset = data ?? (DATASETS[out.dataset ?? ""] ?? DATASETS.sales)();
        const widgets = sanitizeWidgets(out.widgets, dataset);
        if (!widgets.length) {
          setBusy(false);
          return toast.error("The AI returned an empty dashboard. Try rephrasing your request.");
        }
        const id = uid();
        projects.save({
          id,
          name: out.name?.slice(0, 80) || "AI Dashboard",
          description: out.description,
          theme: sanitizeTheme(out.theme),
          dataset,
          widgets,
          filters: {},
          updatedAt: Date.now(),
        });
        sessionStorage.removeItem("dashboard-ai:pending-dataset");
        setBusy(false);
        toast.success("AI dashboard generated.");
        return nav({ to: "/studio/$id", params: { id } });
      }
    } catch (e) {
      // Honest local fallback: deterministic demo generation, clearly labeled.
      const { dashboard } = demoGenerate(prompt, data);
      projects.save(dashboard);
      sessionStorage.removeItem("dashboard-ai:pending-dataset");
      setBusy(false);
      toast.info(
        `AI unavailable (${(e as Error).message ?? "not configured"}) — created a labeled DEMO dashboard instead.`,
      );
      nav({ to: "/studio/$id", params: { id: dashboard.id } });
    }
  }

  return (
    <div className="min-h-screen bg-hero">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-5 py-16">
        <p className="text-sm font-semibold text-primary">AI Builder</p>
        <h1 className="mt-2 text-4xl font-bold">From a simple request to a complete dashboard.</h1>
        <p className="mt-3 text-muted-foreground">
          The copilot understands your goal, picks the right KPIs and charts, and writes the first
          insight.
        </p>

        <div className="mt-8 rounded-2xl border bg-card p-4 shadow-float">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={busy}
            rows={4}
            placeholder="e.g. Show me total sales, top products, and regional performance for 2026"
            className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            {data ? (
              <span className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                <FileSpreadsheet className="h-4 w-4" /> {data.name} · {data.rows.length} rows
                <button
                  onClick={() => {
                    setData(null);
                    sessionStorage.removeItem("dashboard-ai:pending-dataset");
                  }}
                  aria-label="Remove data"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => nav({ to: "/data" })}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                + Use my own data
              </button>
            )}
            <button
              onClick={run}
              disabled={busy}
              className="flex items-center gap-2 rounded-xl bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-70"
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}{" "}
              {busy ? "Generating…" : "Generate dashboard"}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Live AI when you're signed in and the server has an AI provider configured; otherwise
            you get a clearly labeled demo dashboard you can still edit.
          </p>
        </div>

        {busy && (
          <div className="mt-6 surface p-5">
            <p className="mb-3 font-display text-sm font-semibold">Creating your dashboard…</p>
            <ul className="space-y-2">
              {STEPS.map((s, i) => (
                <li
                  key={s}
                  className={`flex items-center gap-2 text-sm ${i <= step ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {i < step ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <span className="h-4 w-4 rounded-full border" />
                  )}{" "}
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
