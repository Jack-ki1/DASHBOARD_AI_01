import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Database,
  FileSpreadsheet,
  LayoutTemplate,
  MessageSquareText,
  MousePointerClick,
  Palette,
  Share2,
  Sparkles,
  Users,
  Wand2,
} from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { DashboardCanvas } from "@/components/Widget";
import { TEMPLATES, dashboardFromTemplate } from "@/lib/dashboard";
import { useTitle } from "@/lib/useTitle";

export const Route = createFileRoute("/")({
  component: Landing,
});

const examples = [
  "Sales performance for the last 6 months by region",
  "Marketing funnel with spend and leads per channel",
  "Hospital operations: patients and wait times by ward",
];

const features = [
  {
    icon: Wand2,
    title: "AI Builder",
    text: "From a simple request to a complete dashboard in seconds.",
    to: "/generate",
  },
  {
    icon: LayoutTemplate,
    title: "Template marketplace",
    text: "Premium templates for every industry, fully customizable.",
    to: "/templates",
  },
  {
    icon: MousePointerClick,
    title: "Studio editor",
    text: "Resize, restyle, reorder and configure every component.",
    to: "/workspace",
  },
  {
    icon: Database,
    title: "Data workspace",
    text: "Upload CSV, clean columns, and turn data into insight.",
    to: "/data",
  },
  {
    icon: Palette,
    title: "Themes & brand",
    text: "Switch entire looks instantly — Light, Ocean, Midnight and more.",
    to: "/templates",
  },
  {
    icon: Share2,
    title: "Publish & share",
    text: "Interactive share links with cross-filtering built in.",
    to: "/workspace",
  },
] as const;

function Landing() {
  useTitle("DASHBOARD AI — Describe it. Generate it. Publish it.");
  const nav = useNavigate();
  const [prompt, setPrompt] = useState("");
  const preview = useMemo(() => {
    const d = dashboardFromTemplate(TEMPLATES[0]);
    return {
      ...d,
      theme: "light" as const,
      widgets: d.widgets.slice(0, 6).map((w, i) => ({ ...w, id: `hero${i}` })),
    };
  }, []);
  const go = (p: string) => nav({ to: "/generate", search: { prompt: p } });

  return (
    <div className="min-h-screen">
      <AppHeader />
      <section className="relative overflow-hidden bg-hero">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_1.15fr] lg:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-accent-foreground shadow-card">
              <Sparkles className="h-3.5 w-3.5" /> Smarter dashboards. Bigger decisions.
            </span>
            <h1 className="mt-5 text-5xl font-extrabold leading-[1.02] md:text-6xl">
              <span className="text-gradient">DASHBOARD AI</span>
            </h1>
            <p className="mt-4 font-display text-2xl font-semibold leading-snug">
              Build dashboards from data, prompts, or templates.
            </p>
            <p className="mt-3 max-w-md text-muted-foreground">
              Turn your ideas and data into powerful dashboards. No coding, no complex setup — just
              insight.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (prompt.trim()) go(prompt);
              }}
              className="mt-7 flex items-center gap-2 rounded-2xl border bg-card p-2 shadow-float"
            >
              <MessageSquareText className="ml-2 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="What dashboard would you like to create?"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button className="flex items-center gap-1.5 rounded-xl bg-gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow">
                <Sparkles className="h-4 w-4" /> Generate
              </button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {examples.map((x) => (
                <button
                  key={x}
                  onClick={() => go(x)}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-foreground"
                >
                  {x}
                </button>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-medium">
              <Link
                to="/data"
                className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 shadow-card hover:border-primary"
              >
                <FileSpreadsheet className="h-4 w-4 text-success" /> Upload CSV
              </Link>
              <Link
                to="/templates"
                className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 shadow-card hover:border-primary"
              >
                <LayoutTemplate className="h-4 w-4 text-primary" /> Choose a template
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-primary opacity-15 blur-3xl" />
            <div className="relative rounded-3xl border bg-card p-3 shadow-float">
              <div className="flex items-center justify-between px-2 pb-3 pt-1">
                <div>
                  <p className="font-display text-sm font-semibold">Good morning, Alex 👋</p>
                  <p className="text-xs text-muted-foreground">Your AI-powered sales overview</p>
                </div>
                <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">
                  Live
                </span>
              </div>
              <DashboardCanvas d={preview} compact />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <p className="text-sm font-semibold text-primary">One platform</p>
        <h2 className="mt-2 max-w-xl text-3xl font-bold md:text-4xl">
          Everything from first prompt to published insight.
        </h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.title}
              to={f.to}
              className="group surface p-6 transition hover:-translate-y-0.5 hover:shadow-float"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-ink p-10 text-ink-foreground md:p-14">
          <div className="absolute inset-0 bg-hero opacity-20" />
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Describe it. Generate it.
              <br />
              <span className="text-gradient">Design it. Analyze it. Publish it.</span>
            </h2>
            <div className="flex gap-3">
              <Link
                to="/generate"
                className="rounded-xl bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Start building
              </Link>
            </div>
          </div>
          <div className="relative mt-8 flex flex-wrap gap-5 text-sm opacity-80">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Share with your team
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> AI copilot in every dashboard
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
