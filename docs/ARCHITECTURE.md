# ARCHITECTURE — DASHBOARD AI (monorepo)

## 1. System overview

```
Browser (frontend/: React 19 SPA, Vite, TanStack Router, Tailwind v4, Recharts)
  │  REST /api/* only (src/lib/api.ts) — no secrets in the bundle
  ▼
Backend (backend/: Express + node:sqlite + JWT, plain JS, no build step)
  ├── auth.js         register/login/me, Bearer JWT, bcrypt passwords
  ├── dashboards.js   CRUD + public share reads, zod-validated docs
  ├── ai.js           generate/edit prompts (auth required)
  ├── provider.js     OpenAI-compatible chat-completions call (AI_* server-only)
  └── db.js           SQLite: users(id,email,password_hash),
                      dashboards(id,user_id,name,doc JSON,published,favorite,archived,…)
```

Data flow (dashboards): UI state → `projects.save()` (localStorage write) →
debounced `PUT /api/dashboards/:id`. On sign-in, `syncFromCloud()` pulls the
server list, pushes device-only docs (claiming pre-login work), server wins on
conflict. Sign-out keeps device data (nothing is wiped).

Data flow (AI): prompt → `POST /api/ai/*` → provider → JSON → frontend
`sanitizeWidgets/sanitizeTheme` → editable dashboard. Without a provider the
backend answers `503 AI_NOT_CONFIGURED` and the frontend uses deterministic
`demoGenerate`/`demoEdit` with DEMO badges. AI output is config only — never
executed, never rendered as HTML.

Sharing: publishing sets `published`; `GET /api/dashboards/shared/:id` serves
published docs with no account. `/view/:id` resolves local → own → shared,
and offers "Save a copy" for dashboards not on the device.

## 2. History note

Before 2026-10-10 this was a TanStack Start app on Lovable Cloud (Supabase
auth/DB, Lovable AI Gateway, server functions). The migration replaced that
with the backend above and a pure Vite SPA; see `docs/IMPLEMENTATION_LOG.md`.
`docs/INITIAL_AUDIT.md` describes the pre-migration state and is kept for
reference.

## 3. Constraints (must keep)

- Studio ribbon commands stay in `StudioRibbon`, bound to the editor's
  existing state handlers — no second dashboard state/persistence path.
- Domain report layouts stay defined in `report-designs`; rendering themed
  through CSS report tokens; only exact unedited legacy layouts auto-upgrade
  (`differentiateDashboard` + `DESIGN_VERSION`).
- The dashboard doc is the shared contract: frontend types
  (`frontend/src/lib/dashboard.ts`) ↔ backend zod `dashboardSchema`
  (`backend/src/dashboards.js`). Change both, plus tests on both sides.
- Reuse Recharts + Radix/shadcn UI. Backend stays build-free plain Node +
  Express; no new framework without a log entry.
- Secrets (`JWT_SECRET`, `AI_*`) are server-only env vars. The frontend sends
  passwords only over the login/register calls and stores just the JWT.

## 4. Type sketch

`Dashboard { id, name, description?, theme, design?, designVersion?, widgets: Widget[], dataset: Dataset, filters, published?, favorite?, archived?, updatedAt, versions? }`
`Widget { id, type (14 renderer-supported), title, metric?, dimension?, agg?, w (span/12), h, color?, text?, format?, … }`
