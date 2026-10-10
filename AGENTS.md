# AGENTS.md — DASHBOARD AI (monorepo)

Monorepo with npm workspaces: `frontend/` (React SPA) and `backend/`
(Express + SQLite API). No Lovable, Supabase, or TanStack Start remains.

## Boundaries

- `frontend/` may only talk to the backend over REST (`src/lib/api.ts`).
  No secrets, AI keys, or passwords in the frontend bundle — ever.
- `backend/` owns auth (JWT), persistence (SQLite), and all AI provider calls
  (`AI_*` env vars are server-only). AI responses are validated JSON config —
  never executed, never rendered as HTML.
- Auth flow: email + password → JWT (`dashboard-ai:token`) → `AuthProvider`.
  AI endpoints require auth; without a provider they return `503 AI_NOT_CONFIGURED`
  and the frontend uses labeled local demo generation.

## Conventions to preserve

- Keep Studio ribbon commands in `StudioRibbon` and bind them to the editor's
  existing state handlers; presentation changes must not introduce a second
  dashboard state or persistence path.
- Define domain-specific report layouts in `report-designs` and theme their
  shared rendering through CSS report tokens; upgrade only exact unedited
  legacy template layouts to preserve user changes.
- Dashboard docs are the shared contract (`frontend/src/lib/dashboard.ts`
  types ↔ backend zod `dashboardSchema` in `backend/src/dashboards.js`).
  Changing one side means updating the other plus tests on both sides.

## Commands (repo root)

- `npm run dev` — backend :4000 + frontend :5173 (proxy `/api`)
- `npm test` — backend node:test suite, then frontend vitest suite
- `npm run typecheck` / `npm run lint` / `npm run build`
- `npm start` — serves `frontend/dist` from the backend (build first)

## Rules

- Never commit `.env` files, JWT secrets, AI keys, or `backend/data/*.db`.
- Backend stays dependency-light and build-free (plain Node + Express).
- Don't add a new UI library, chart library, or backend framework without a
  reason recorded in `docs/IMPLEMENTATION_LOG.md`.
