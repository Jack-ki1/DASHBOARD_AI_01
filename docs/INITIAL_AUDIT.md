# INITIAL AUDIT — DASHBOARD AI (2026-10-10)

## Executive summary

The repository is a **working Lovable-generated AI dashboard builder**, not an empty scaffold.
Stack: **React 19 + TypeScript + Vite 8 + TanStack Start/Router + Tailwind CSS v4 + shadcn-style UI + Recharts + Supabase (Lovable Cloud)**.
Core flows (landing → AI Builder → templates → Studio editor → data workspace → share view → workspace) all exist and render real data from typed config. Persistence is **localStorage-first with optional Supabase cloud sync** when signed in. AI generation/editing runs through **server functions (`src/lib/ai.functions.ts`) calling the Lovable AI Gateway** with `LOVABLE_API_KEY` server-side — honest design, but there is **no local demo fallback**: without auth/credits the Generate/Copilot actions just return errors.
Not a git repo (`fatal: not a git repository`). No `node_modules` installed. Package manager: `bun.lock` present but `bun` is not installed here; `npm` 11 + node 24 available, README documents `npm i` / `npm run dev`.

## Verified stack

| Area        | Finding                                                                                                                                                                                                                                         | Status                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| Frontend    | React 19.2, TanStack Router 1.170 + Start 1.168, Tailwind v4, Radix UI, lucide-react, Recharts 2.15, React Query, react-hook-form+zod                                                                                                           | VERIFIED (`package.json`)                              |
| Build/dev   | Vite 8.1.5 via `@lovable.dev/vite-tanstack-config`; scripts: `dev`=`vite dev`, `build`=`vite build`, `lint`, `format`, `test`/`test:watch` (vitest)                                                                                             | VERIFIED                                               |
| Backend     | No standalone backend. TanStack Start server functions in `src/lib/ai.functions.ts` + SSR wrapper `src/server.ts`. Supabase client in `src/integrations/supabase/`                                                                              | VERIFIED                                               |
| Database    | Supabase Postgres, table `dashboards` (referenced in `src/lib/store.ts`: `id, name, data, published, user_id, updated_at`). `drizzle/schema.ts` is blank placeholder, `drizzle/` has migrations dir. No local DB                                | PARTIAL                                                |
| Auth        | Supabase auth + `@lovable.dev/cloud-auth-js` OAuth (Google). `requireSupabaseAuth` middleware gates AI server functions. Sign-in/up/reset pages exist (`auth.tsx`, `reset-password.tsx`)                                                        | VERIFIED (code), UNVERIFIED (live, no creds exercised) |
| AI          | `ai.server.ts`: `runAi` → Lovable AI Gateway (`openai/gpt-6-astra`) via `LOVABLE_API_KEY` env (server-only). `extractJson` + `sanitizeWidgets/sanitizeTheme` validate outputs. No `eval`, no raw HTML render                                    | VERIFIED (code), UNVERIFIED (live call)                |
| Persistence | `src/lib/store.ts`: localStorage `dashboard-ai:projects` + debounced Supabase upsert for UUID ids when signed in. Honest local/demo labeling in share dialog ("saved on this device for now")                                                   | VERIFIED                                               |
| Tests       | Vitest + jsdom, 1 test file (`src/test/app-routing.test.tsx`, route match only)                                                                                                                                                                 | VERIFIED                                               |
| Env         | `.env` exists locally (not inspected for values). Names found in code: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`, `LOVABLE_CRON_SECRET*` | PARTIAL (names only)                                   |
| Git         | No `.git` directory                                                                                                                                                                                                                             | MISSING                                                |

## Repository map

```
src/routes/        index.tsx (landing), generate.tsx (AI Builder), templates.tsx, studio.$id.tsx (Studio),
                   data.tsx (CSV workspace), workspace.tsx (gallery), view.$id.tsx (share view),
                   auth.tsx, reset-password.tsx, privacy.tsx, terms.tsx, __root.tsx (shell)
src/components/    Widget.tsx (KPI/line/area/bar/donut/table/insight renderer), ExtendedChart.tsx
                   (sparkline/radial/heatmap/radar/stacked), StudioRibbon.tsx (ribbon commands),
                   AppHeader.tsx, ReportHeading.tsx, ui/* (shadcn primitives)
src/lib/           dashboard.ts (types, THEMES[5], TEMPLATES[9], DATASETS[9], analytics, CSV parse, autoWidgets),
                   demo-data.ts (9 deterministic synthetic datasets), report-designs.ts (9 layouts SPECS + designWidgets),
                   store.ts (localStorage + Supabase sync), sanitize.ts, ai.functions.ts, ai.server.ts
src/integrations/  supabase/ (client, auth-middleware, types), lovable/ (cloud auth)
drizzle/           schema.ts (blank), migrations/, config wants LOVABLE_DB_MIGRATION_URL
supabase/          config.toml (project_id only)
```

## Frontend architecture

File-based routing (TanStack). `__root.tsx` shell + `AppHeader` nav (AI Builder/Templates/Data/Workspace). Dashboard is a **typed config object** (`Dashboard`: id/name/theme/design/widgets/dataset/filters/published/versions) rendered by `DashboardCanvas`/`WidgetView`. Themes via `THEMES` + CSS report tokens (`--report-*`). Studio (`studio.$id.tsx`, ~435 lines) holds dashboard state, undo/redo stacks (cap 40), selection, zoom, filters, autosave (400ms debounce → `projects.save`), layers/versions panels, property inspector, spreadsheet `DataGrid` with safe calculated-column formula subset (regex-validated + `Function` on sanitized arithmetic only — review note below), CSV/JSON export, print, share dialog.

## Backend architecture

Server boundary = TanStack Start server functions `generateDashboard` / `editDashboard`: zod-validated input, Supabase-auth middleware, prompt construction server-side, gateway call, JSON extraction, client re-validates via sanitize. Secrets stay server-side. No REST/edge-function sprawl.

## Database / persistence

No local DB. Browser localStorage for all projects; Supabase `dashboards` table for cloud sync of UUID ids when authenticated. Version history stored inside dashboard object (cap 20). No RLS policy file in repo — policies live in Lovable Cloud (UNVERIFIED). No destructive ops in code.

## Auth / security

Supabase session via `initAuth` + `useSession`. AI routes require auth server-side. Good: no API keys in frontend bundle (`LOVABLE_API_KEY` only in `ai.server.ts` via `process.env`). Upload validation: CSV extension + empty check. XSS: no `dangerouslySetInnerHTML` found; AI output is JSON-validated, never rendered as HTML. Watch item: `DataGrid.addCalc` uses `Function(...)` on a regex-sanitized arithmetic expression over numeric columns only — acceptable but should stay restricted (documented, no `eval`).

## AI status: PARTIAL (honest but brittle)

Real provider path exists and is correctly server-side. Gaps: (1) AI requires sign-in even for demo; (2) no demo/deterministic fallback when `LOVABLE_API_KEY` absent — user gets raw error toast; (3) insight widgets are model-written text (hypotheses, not computed facts); no computed data-grounded insight engine; (4) `WIDGET_DOC` allows only 8 widget types though renderer supports 14+.

## Page inventory

| Page                                             | Status          | Notes                                                                                                                |
| ------------------------------------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/` landing                                      | VERIFIED        | Hero prompt → `/generate?prompt=`, Upload CSV → `/data`, live preview canvas                                         |
| `/generate`                                      | PARTIAL         | Real server AI; fails without auth/credits, no demo fallback                                                         |
| `/templates`                                     | PARTIAL         | 9 templates, search + category only; no tag/sort; preview = live mini canvas (good)                                  |
| `/studio/$id`                                    | VERIFIED        | Select/move-order/resize-via-props/add/dup/delete/undo/redo/zoom/filters/themes/versions/datagrid/export/print/share |
| `/data`                                          | PARTIAL         | CSV only; basic quality (rows, numeric cols, missing); no JSON/Excel, shallow profiling                              |
| `/workspace`                                     | PARTIAL         | Grid + duplicate/delete/view; no favorites/search/sort/archive                                                       |
| `/view/$id`                                      | VERIFIED        | Read-only canvas + cross-filter + clear; local-only availability message                                             |
| `/auth`, `/reset-password`, `/privacy`, `/terms` | VERIFIED (code) | Standard flows                                                                                                       |

## Broken / incomplete behavior

1. No demo fallback for AI Builder/Copilot (error-only when unconfigured).
2. Only 5 themes (light/ocean/midnight/sunset/forest) vs 17 required.
3. Only 9 templates/datasets; missing Agriculture, IoT/Smart City, AI/ML Ops (guide §9 requires 10 named industries).
4. Marketplace lacks tag filters + sort; template `tag` values (Premium/AI-ready/Dark/Minimal) are static labels, not entitlements.
5. Workspace lacks favorites/recent/search/sort/archived.
6. No command palette (Ctrl+K), no global search, no notification center.
7. No JSON/Excel import; CSV parser is naive wrt quoted commas edge cases (partially handled).
8. No computed insights/anomaly engine — insights are model text.
9. Collaboration (comments, mentions, roles, activity) NOT IMPLEMENTED; sharing is device-local link, honestly labeled.
10. `differentiateDashboard` upgrade path exists for legacy layouts — must preserve per AGENTS.md.
11. No git repo; no CI.

## Risks

- AI quality depends on Lovable Gateway credits; unbounded widget JSON could bloat prompts (capped at 40 widgets client-side, 24 in sanitize).
- `Function()` in DataGrid is contained but should never widen.
- Supabase RLS/policies unverifiable locally; must not claim enforcement.
- Recharts v2 on React 19 — works today, watch upgrades.

## Checks performed (read-only)

Listed top-level files, inspected `package.json`/lockfile presence, vite/tsconfig, all routes, `lib/*`, integrations, `drizzle.config.ts`, `supabase/config.toml`, test config + test, `.gitignore`, `roadmap.md`, env var _names_ via grep (values never printed).

## Classified feature matrix (REAL / PARTIAL / DEMO / NOT IMPLEMENTED)

- Landing + prompt routing: REAL · Template gallery open-in-Studio: REAL · Studio edit/undo/redo/autosave: REAL
- CSV import + auto dashboard: REAL · Cross-filter dashboards: REAL · Viewer/presentation mode: REAL (local)
- AI generate/edit: PARTIAL (real path, no fallback, needs auth+credits) · Data quality panel: PARTIAL
- Themes (5): PARTIAL · Templates (9 industries): PARTIAL · Workspace mgmt: PARTIAL
- Demo datasets (9, synthetic): DEMO (honest synthetic) · Formula subset: DEMO/PARTIAL
- Command palette, global search, notifications, comments, roles, activity, exports PNG/PDF, embed beyond iframe string, JSON/Excel import, computed insights, 17 themes: NOT IMPLEMENTED
