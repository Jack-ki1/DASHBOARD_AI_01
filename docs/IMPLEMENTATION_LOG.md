# IMPLEMENTATION LOG

## 2026-10-10 — M1: audit + docs foundation

- Inspected repo read-only: `package.json`, routes, `lib/*`, integrations, drizzle, supabase, tests, env names (values never printed).
- Findings: React 19 + TanStack Start/Router + Tailwind v4 + Recharts + Supabase; Studio/AI Builder/templates/CSV/viewer/workspace all present; no `.git`; `node_modules` absent; `bun` unavailable (npm used).
- Created `docs/INITIAL_AUDIT.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, this log.

## 2026-10-10 — M2: stability checks

- `npm i` ok (559 packages; bun unavailable, npm used; `bun.lock` untouched).
- Fixed real type error: `dashboard.ts` imported `DESIGN_VERSION` / `isLegacyDesignLayout` which `report-designs.ts` did not export. Added both: `DESIGN_VERSION = 2` + structural `isLegacyDesignLayout` (true only for exact unedited spec layouts, preserving user edits per AGENTS.md).
- `npx tsc --noEmit`: PASS. `npm test`: 1/1 PASS. `npm run build`: PASS. `npm run dev`: serves on :8080.
- `npm run lint`: FAIL pre-existing — 787 prettier formatting errors across untouched files (drift, not regressions). Decision: normalize with repo's own `npm run format` in M11, keep new code prettier-clean meanwhile.
- Next: M4/M8 domain expansion (datasets, designs, templates, themes), then M7 AI demo fallback.

## Milestone status

- [x] M1 (docs, env template, gitignore, README)
- [x] M2 stability & checks (tsc/test/build/dev verified; lint normalized to 0 errors)
- [x] M3 gallery (search, collections, sort, favorites, archive)
- [x] M4 marketplace (12 templates / 12 datasets / 12 designs, tag filter, sort, live previews)
- [x] M5 studio (Ctrl+D/Ctrl+S, KPI formats, empty-state CTA, ribbon wraps 17 themes)
- [x] M6 data (JSON import, size/row guards, duplicates + column profiling, honest connector states)
- [x] M7 AI demo fallback (demoGenerate + DEMO badges + demoEdit copilot ops + computed insights)
- [x] M8 themes (17 total) + component coverage via ribbon VISUALS (14 visual types)
- [x] M9-11 persistence/viewer-exports (viewer CSV), 16 tests, prettier normalize, full checks

## 2026-10-10 — M4+M8: domain expansion

- `demo-data.ts`: added `agriData` (Smart Farm: yield/rainfall/soil/temp/irrigation/cost), `iotData` (Smart City: devices/online/energy/alerts/uptime), `aimlData` (ML Ops: requests/latency/accuracy/errors/drift/cost) — deterministic `rng`, all synthetic.
- `report-designs.ts`: added `harvest`, `sentinel`, `models` layouts.
- `dashboard.ts`: +12 themes (aurora/emerald/corporate/minimal/glass/neon/mono/royal/healthcare/finance/agriculture/iot, dark ones intentional), `favorite?`/`archived?` on Dashboard, DATASETS 9→12, TEMPLATES 9→12.
- `ai.functions.ts`: WIDGET_DOC covers all 14 renderer types + 17 themes; model dataset hints for new industries.

## 2026-10-10 — M7: honest AI

- New `src/lib/insights.ts`: computed, data-grounded insights (period compare, top contributor, z-score outlier flag, completeness note) with metric + limitation on each.
- New `src/lib/demo-generate.ts`: keyword→dataset/theme deterministic generation + `demoEdit` (theme/simplify/insight/KPI).
- `generate.tsx`: server AI first; any failure → labeled DEMO dashboard + info toast (never fake). Added upfront honesty note.
- Studio Copilot: server first, then `demoEdit`, else honest capability message. DEMO badge in Studio header for demo-built dashboards.

## 2026-10-10 — M3/M4 UI: gallery + marketplace

- `workspace.tsx`: search, collections (All/Favorites/Recent/Published/Drafts/Archived) with counts, sort, favorite toggle, archive/restore, Demo marker.
- `templates.tsx`: tag filter, sort (Featured/Name/Category), result counts, real meta per card (visual count, theme, synthetic-data note).
- New `CommandPalette.tsx` (Ctrl+K, arrows+enter+esc): implemented commands only + 5 recent dashboards + all templates; mounted in AppHeader and Studio with a Ctrl+K hint button.

## 2026-10-10 — M5/M6: studio + data

- Studio: Ctrl+S force-save, Ctrl+D duplicate, KPI number formats (currency/percent/minutes/rating) rendered + inspector control + sanitize passthrough, empty-canvas CTA quick-add. Ribbon theme group wraps.
- Data: JSON import (`parseJSON` in dashboard.ts), 5 MB guard, 2000-row cap notice, duplicate-row + per-column (type/distinct/empty) profiling, SETUP REQUIRED connector cards (Sheets/Postgres/REST) with toasts — no fake connected badges.

## 2026-10-10 — M9-11: QA

- Viewer (`view.$id.tsx`): CSV export added.
- `ai.functions.ts` Result typed as serializable `Json` (was `any`); call-site narrowing casts.
- Fixed 4 lint errors; `npm run format` normalized whole repo; lint now 0 errors (8 benign react-refresh warnings in shadcn/ui + Widget).
- New `src/lib/domain.test.ts`: 15 domain tests (analytics, CSV/JSON parsing, autoWidgets, all-template loading, legacy-upgrade guard, sanitize, insights, demo gen/edit). Suite: 16/16 pass.
- Verified: `npx tsc --noEmit` PASS · `npm run lint` 0 errors · `npm test` 16/16 · `npm run build` PASS · `npm run dev` serves, SSR 200 on /, /templates, /data, /workspace, /generate.
- Known: `npx vite preview` cannot serve this nitro-target build (pre-existing config mismatch, missing dist/server/server.js); dev + build are the verified paths. Secrets boundary verified by grep: LOVABLE_API_KEY/service-role/cron only in server files.

## 2026-10-10 — Monorepo migration (Lovable elimination, backend/frontend split)

- Moved `src/` → `frontend/src`, `public/` → `frontend/public`; new `backend/`
  (Express + node:sqlite + JWT + zod, plain JS, no build step).
- Deleted: `integrations/` (Supabase + Lovable), `server.ts`, `start.ts`,
  `lib/ai.functions.ts`, `lib/ai.server.ts`, `lib/lovable-error-reporting.ts`,
  `lib/error-capture.ts`, `lib/error-page.ts`, `routes/reset-password.tsx`,
  `supabase/`, `.lovable/`, `drizzle/`, `drizzle.config.ts`, `bun.lock`,
  `bunfig.toml`, old root `vite.config.ts`, root `.env` (secret-bearing).
- Removed deps: `@tanstack/react-start`, `@supabase/*`, `@lovable.dev/*`,
  `ai`, `@ai-sdk/openai`, `drizzle-*`, `nitro`, `postgres`,
  `vite-tsconfig-paths` (Vite 8 native `tsconfigPaths` instead).
- New backend routes: auth register/login/me, dashboard CRUD + PUT upsert,
  public `GET /dashboards/shared/:id`, AI generate/edit with
  OpenAI-compatible provider or `503 AI_NOT_CONFIGURED`. Tests: 9/9 node:test.
- Frontend is a pure SPA (`index.html` + `main.tsx`, router plugin): per-route
  `head` replaced by `useTitle`; server fns replaced by `lib/api.ts`;
  Supabase session replaced by `lib/auth.tsx` (JWT); store syncs to backend
  with server-wins merge; view page resolves shared links + "Save a copy".
- Auth is email+password only (no OAuth, no email → no password reset).
- Root npm workspaces: `dev` (concurrently), `test` (backend then frontend),
  `build`/`start` (single-port prod). Added Dockerfile + compose + READMEs,
  rewrote AGENTS.md, README.md, ARCHITECTURE.md, ROADMAP.md.

## 2026-10-10 — README rewrite + extensive verification

- Rewrote root README as the full project document: features, stack tables,
  architecture diagram + flows, annotated folder-structure breakdown, prereqs,
  install/first-run, env reference, run modes, scripts, API table + curl
  session, SQLite schema, auth/security model, AI setup (OpenAI + Ollama),
  testing guide, REAL/DEMO status, troubleshooting table, roadmap, license note.
- Cleaned stale leftovers: root `.env.example` (Supabase vars), `.output/`,
  `.wrangler/`, old `roadmap.md`; moved `components.json` into `frontend/`;
  removed nested `backend/package-lock.json` (single root lockfile now).
- Static: `tsc` clean, eslint 0 errors (9 benign react-refresh warnings),
  backend 9/9, frontend 16/16.
- Live backend (`/tmp/extest.mjs`, 61 checks, all pass): email normalization,
  duplicate/invalid registration, login failures, token gating incl. garbage
  tokens, CRUD + PUT upsert + validation limits, newest-first listing,
  cross-user 404 isolation, publish/unpublish share lifecycle, AI 401 + 503 +
  400s, unknown-route 404, malformed-JSON 500 without crashing, dev JWT warning.
- Live frontend: 8/8 dev routes 200, shell + `/api` proxy OK, bundle contains
  all code-split pages, `vite preview` serves root + deep route, `npm start`
  serves dist + SPA fallback + API/JSON-404 together, root `npm run dev`
  boots both servers with working proxy.
- Fresh `rm -rf node_modules && npm i` reinstall verified (560 packages,
  single lockfile, all checks re-run green after).
- NOT verified: real browser interaction (no browser tooling here — client
  flows covered by unit + API tests only) and `docker build` (no daemon).
