# DASHBOARD AI — Describe it. Generate it. Design it. Analyze it. Publish it.

An AI-native dashboard creation platform. Start from a natural-language prompt,
an uploaded dataset, or a professionally designed template — then refine
everything in a visual Studio and publish a shareable interactive view.

This is a self-contained monorepo: a **React frontend** and an **Express +
SQLite backend** with its own email/password auth and a pluggable AI provider.
No third-party cloud account is required to run it.

- Backend tests: 9/9 passing (`node:test`) · Frontend tests: 16/16 passing (vitest)
- `tsc --noEmit` clean · `eslint` 0 errors
- Statuses in this document are verified, not aspirational: **REAL** means it
  works end to end, **DEMO** means it is synthetic but honestly labeled in the
  UI, **NOT IMPLEMENTED** means it does not exist (no fake badges anywhere).

## Table of contents

- [DASHBOARD AI — Describe it. Generate it. Design it. Analyze it. Publish it.](#dashboard-ai--describe-it-generate-it-design-it-analyze-it-publish-it)
  - [Table of contents](#table-of-contents)
  - [1. Features](#1-features)
  - [2. Tech stack](#2-tech-stack)
  - [3. Architecture](#3-architecture)
  - [4. Repository structure](#4-repository-structure)
  - [5. Prerequisites](#5-prerequisites)
  - [6. Installation \& first run](#6-installation--first-run)
  - [7. Configuration reference](#7-configuration-reference)
  - [8. Running the app](#8-running-the-app)
  - [9. Scripts reference](#9-scripts-reference)
  - [10. API reference](#10-api-reference)
  - [11. Data model](#11-data-model)
  - [12. Auth \& security model](#12-auth--security-model)
  - [13. AI setup](#13-ai-setup)
  - [14. Testing](#14-testing)
  - [15. REAL vs DEMO vs NOT IMPLEMENTED](#15-real-vs-demo-vs-not-implemented)
  - [16. Troubleshooting](#16-troubleshooting)
  - [17. Roadmap](#17-roadmap)
  - [18. License](#18-license)

## 1. Features

**Create (REAL)**

- AI Builder (`/generate`): describe a dashboard, watch staged progress, land
  in the Studio with an editable result. Works signed-out or without AI keys
  via labeled demo generation (see [AI setup](#13-ai-setup)).
- Template marketplace (`/templates`): 12 industry templates (Sales,
  Finance, Marketing, HR, Healthcare, E-commerce, Supply Chain, Energy,
  Regional Sales, Agriculture, IoT/Smart City, AI/ML Ops) with search,
  category + tag filters, sorting, and live-rendered previews. "Use" opens the
  full editable configuration in the Studio — never a screenshot.
- Data workspace (`/data`): CSV and JSON import (5 MB / 2,000-row guards),
  data preview, quality profiling (rows, columns, numeric detection, missing
  values, duplicate rows, per-column distinct counts), one-click instant
  dashboard or AI generation from your file.

**Studio editor (REAL)** — the flagship, at `/studio/$id`:

- Ribbon toolbar (Home / Insert / Design / View), layers panel, versions
  (snapshot + restore, cap 20), undo/redo (cap 40), zoom, cross-filtering.
- Canvas: select, add, duplicate (`Ctrl+D`), delete, reorder, resize via
  properties, responsive 12-column grid.
- Context-sensitive inspector: data binding, aggregation, chart config,
  width/height, palette color, KPI number formats, insight text.
- Spreadsheet-like data grid with editable cells and safe calculated columns
  (validated `[Column]` arithmetic only — no `eval`).
- Autosave (debounced, with explicit `Ctrl+S`), CSV/JSON export, print,
  publish/share dialog, Studio copilot with live-AI-first + local-demo fallback.

**Render & analyze (REAL)**

- 14 visual types: KPI, line, area, bar, donut, table, insight, funnel,
  sparkline, ranking bars, stacked bars, share rings, heatmap, radar — all
  with titles, axes, legends, tooltips, empty states, and cross-filtering
  (click a bar/slice to filter the whole dashboard).
- Computed, data-grounded insights (period comparison, top contributor,
  z-score outlier flag, completeness note), each carrying its metric and
  limitations. No hallucinated "findings".
- 17 themes (including intentional dark designs), switchable per dashboard
  and persisted.

**Organize & share (REAL)**

- Workspace gallery with search, collections (All / Favorites / Recent /
  Published / Drafts / Archived), sorting, favorites, archive/restore,
  duplicate, delete with confirmation.
- Publishing produces a public link (`/view/:id`) that works **without an
  account**; viewers can filter, export CSV, and save a copy to their own
  workspace.
- Command palette (`Ctrl+K`): implemented commands only, recent dashboards,
  and one-action template use.

## 2. Tech stack

**Frontend** (`frontend/`) — pure client-side SPA, no server code, no secrets.

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| UI         | React 19 + TypeScript (strict), Vite 8              |
| Routing    | TanStack Router, file-based SPA mode                |
| Styling    | Tailwind CSS v4, shadcn/Radix primitives (46 `ui/` components), Lucide icons |
| Charts     | Recharts 2                                         |
| State      | Local component state + `lib/store.ts` (device cache + cloud sync) |
| Validation | zod (route search params, AI output sanitizing)     |

**Backend** (`backend/`) — dependency-light, build-free plain JavaScript.

| Layer      | Choice                                              |
| ---------- | --------------------------------------------------- |
| Server     | Express 4 on Node.js 24                             |
| Database   | SQLite via built-in `node:sqlite` (no native addons, file at `DATABASE_PATH`) |
| Auth       | `bcryptjs` password hashing + `jsonwebtoken` Bearer tokens |
| Validation | `zod` request schemas                               |
| AI         | Direct `fetch` to any OpenAI-compatible chat-completions endpoint |
| Tests      | `node:test` against a live ephemeral server + temp DB |

## 3. Architecture

```
┌─ Browser ─────────────────────────────────────────────┐
│ frontend/  React SPA (Vite :5173 in dev)              │
│   routes/  / /generate /templates /studio/$id /data   │
│            /workspace /view/$id /auth /privacy /terms │
│   lib/api.ts ── REST /api/* ONLY ───────────────┐    │
└──────────────────────────────────────────────────│────┘
                                                   │  (dev: Vite proxies
                                                   │   /api → :4000;
                                                   │   prod: same origin)
┌─ Server ─────────────────────────────────────────│────┐
│ backend/  Express (:4000)                        ▼    │
│   auth.js         register/login/me · Bearer JWT      │
│   dashboards.js   CRUD + PUT upsert + public shares  │
│   ai.js           generate/edit prompts (auth first) │
│   provider.js     OpenAI-compatible call (AI_* here) │
│   db.js           SQLite: users, dashboards           │
│   + serves frontend/dist when built (single port)    │
└──────────────────────────────────────────────────────┘
```

**Request flows**

- *Dashboards:* UI edit → `projects.save()` writes localStorage instantly →
  debounced `PUT /api/dashboards/:id`. On sign-in, `syncFromCloud()` pulls
  the server list, pushes device-only docs (claiming pre-login work), and the
  server wins on conflict. Sign-out keeps device data — nothing is wiped.
- *AI:* prompt → `POST /api/ai/*` (auth required) → provider → JSON →
  frontend `sanitizeWidgets`/`sanitizeTheme` → editable dashboard. No
  provider → `503 AI_NOT_CONFIGURED` → deterministic local demo generation
  with DEMO badges. Model output is configuration only: never executed, never
  rendered as HTML.
- *Sharing:* publishing flips `published`; unauthenticated
  `GET /api/dashboards/shared/:id` serves published docs; `/view/:id`
  resolves device → own → shared and offers "Save a copy".

**Hard boundaries**

- `frontend/` may only reach the backend through `src/lib/api.ts`. No AI
  keys, JWT secrets, or passwords in the bundle — ever.
- `backend/` owns auth, persistence, and provider calls. `AI_*` and
  `JWT_SECRET` never leave the server process.
- The dashboard document is the shared contract: frontend TypeScript types
  (`frontend/src/lib/dashboard.ts`) ↔ backend zod `dashboardSchema`
  (`backend/src/dashboards.js`). Change one side and you must update the
  other plus tests on both sides.

## 4. Repository structure

```
.
├── frontend/                    # React SPA — no backend code, no secrets
│   ├── index.html               # SPA shell (#root, fonts, title)
│   ├── vite.config.ts           # router plugin + react + tailwind, /api proxy
│   ├── vitest.config.ts         # jsdom suite
│   ├── tsconfig.json
│   ├── components.json          # shadcn conventions
│   ├── .env.example             # VITE_API_URL (empty = same-origin /api)
│   ├── public/                  # favicon.ico, robots.txt
│   └── src/
│       ├── main.tsx             # SPA entry: mounts RouterProvider
│       ├── router.tsx           # router instance (routeTree.gen.ts)
│       ├── routeTree.gen.ts     # AUTO-GENERATED by the router plugin
│       ├── styles.css           # Tailwind v4 + report tokens + app theme
│       ├── routes/              # file-based pages (see table below)
│       │   ├── __root.tsx       # providers (Auth, QueryClient), 404/500 UI
│       │   ├── index.tsx        # landing: hero prompt → /generate, preview
│       │   ├── generate.tsx     # AI Builder (live AI → demo fallback)
│       │   ├── templates.tsx    # marketplace: search/filter/sort/use
│       │   ├── studio.$id.tsx   # the Studio editor + copilot + data grid
│       │   ├── data.tsx         # CSV/JSON import, profiling, connectors
│       │   ├── workspace.tsx    # gallery: collections, favorites, archive
│       │   ├── view.$id.tsx     # public viewer + CSV export + save-a-copy
│       │   ├── auth.tsx         # sign in / create account
│       │   ├── privacy.tsx / terms.tsx
│       │   └── README.md        # routing conventions
│       ├── components/
│       │   ├── AppHeader.tsx    # top nav, auth state, palette entry
│       │   ├── StudioRibbon.tsx # ribbon tabs + VISUALS catalog (14 types)
│       │   ├── Widget.tsx       # core renderers (KPI/line/area/bar/…)
│       │   ├── ExtendedChart.tsx# sparkline/radial/heatmap/radar/stacked
│       │   ├── CommandPalette.tsx# Ctrl+K palette
│       │   ├── ReportHeading.tsx# report header block
│       │   └── ui/              # 46 shadcn primitives (button, dialog, …)
│       ├── lib/
│       │   ├── api.ts           # THE backend boundary (fetch wrapper + JWT)
│       │   ├── auth.tsx         # AuthProvider: login/register/logout/me
│       │   ├── store.ts         # device cache + backend sync + useProjects
│       │   ├── dashboard.ts     # Dashboard/Widget/Dataset types, 17 THEMES,
│       │   │                    # 12 TEMPLATES/DATASETS, analytics, CSV+JSON
│       │   ├── demo-data.ts     # 12 deterministic synthetic datasets
│       │   ├── report-designs.ts# 12 report layouts + legacy-upgrade guard
│       │   ├── demo-generate.ts # labeled local generation + demo copilot ops
│       │   ├── insights.ts      # computed data-grounded insights
│       │   ├── sanitize.ts      # validates AI JSON before it touches state
│       │   ├── useTitle.ts      # SPA page titles
│       │   ├── utils.ts         # class-name helper
│       │   └── domain.test.ts   # 15 domain tests
│       ├── hooks/use-mobile.tsx
│       └── test/                # routing test + jsdom setup
├── backend/                     # Express + SQLite API — plain JS, no build
│   ├── src/
│   │   ├── index.js             # loads .env, inits DB, listens on PORT
│   │   ├── app.js               # express wiring, CORS, static frontend, errors
│   │   ├── db.js                # node:sqlite schema + dashboard helpers
│   │   ├── auth.js              # register/login/me, JWT middleware
│   │   ├── dashboards.js        # CRUD, PUT upsert, public share reads
│   │   ├── ai.js                # /ai/generate + /ai/edit (auth, validated)
│   │   └── provider.js          # OpenAI-compatible call, 503 when unconfigured
│   ├── test/api.test.js         # 9 API tests (auth, CRUD, sharing, AI 503)
│   ├── .env.example             # all server settings with safe placeholders
│   └── README.md                # backend-focused reference
├── docs/                        # ARCHITECTURE, ROADMAP, IMPLEMENTATION_LOG,
│                                # INITIAL_AUDIT (pre-split history, reference)
├── Dockerfile                   # multi-stage: build frontend, serve via backend
├── docker-compose.yml           # single service + SQLite volume
├── package.json                 # npm workspaces + root scripts
├── eslint.config.js / .prettierrc / .gitignore
└── AGENTS.md                    # working rules for this repo
```

**Routes cheat-sheet**

| URL            | Page              | Needs account? | Notes                              |
| -------------- | ----------------- | -------------- | ---------------------------------- |
| `/`            | Landing           | no             | hero prompt → `/generate?prompt=`  |
| `/generate`    | AI Builder        | no             | live AI if possible, else DEMO     |
| `/templates`   | Marketplace       | no             | 12 templates → Studio              |
| `/studio/:id`  | Studio editor     | no             | edits device/account dashboards    |
| `/data`        | Data workspace    | no             | CSV/JSON import + profiling        |
| `/workspace`   | Gallery           | no             | collections, favorites, archive    |
| `/view/:id`    | Public viewer     | no             | published links work logged-out    |
| `/auth`        | Sign in / up      | —              | email + password (8+ chars)        |
| `/privacy`, `/terms` | Legal pages | no             | —                                  |

## 5. Prerequisites

- **Node.js 24** (SQLite comes built into Node — no compiler, no native
  modules, no Docker needed). Any 22.5+ works; 24 is tested.
- **npm** (comes with Node). Do not mix in pnpm/yarn/bun lockfiles.

## 6. Installation & first run

```sh
git clone <this-repo> && cd <this-repo>

# 1. Install everything (root + frontend + backend workspaces)
npm install

# 2. Configure the backend (frontend needs no config for local dev)
cp backend/.env.example backend/.env
# Edit backend/.env and set JWT_SECRET to a long random string.
# Leave AI_* empty for now — demo mode covers AI features honestly.

# 3. Start both servers
npm run dev
```

Open **http://localhost:5173**. Go to **Sign in → Create an account**
(any email works locally, password 8+ characters). Then:

1. **Templates** → open one → it loads editable in the Studio.
2. Change a chart, switch theme (Design tab), press `Ctrl+S`.
3. **Publish** → open the share link in a private window: it renders with
   no account. That is the whole loop working.

## 7. Configuration reference

Backend (`backend/.env` — copy from `backend/.env.example`). Never commit
real values; never prefix server secrets with `VITE_`.

| Variable         | Required | Default                  | Purpose                                              |
| ---------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `PORT`           | no       | `4000`                   | backend listen port (frontend proxy expects this)    |
| `DATABASE_PATH`  | no       | `backend/data/app.db`    | SQLite file (tests use temp files)                   |
| `CORS_ORIGIN`    | no       | `http://localhost:5173`  | comma-separated browser origins allowed on the API   |
| `JWT_SECRET`     | prod yes | insecure dev default + warning | signs login tokens                              |
| `JWT_EXPIRES_IN` | no       | `7d`                     | token lifetime                                       |
| `AI_BASE_URL`    | for AI   | —                        | e.g. `https://api.openai.com/v1` (no trailing slash) |
| `AI_API_KEY`     | for AI   | —                        | provider bearer key, server-only                     |
| `AI_MODEL`       | for AI   | —                        | e.g. `gpt-4o-mini`                                   |
| `FRONTEND_DIST`  | no       | `../frontend/dist`       | static frontend served by the backend in production  |

Frontend (`frontend/.env` — copy from `frontend/.env.example`):

| Variable       | Required | Default | Purpose                                            |
| -------------- | -------- | ------- | -------------------------------------------------- |
| `VITE_API_URL` | no       | empty   | backend base URL. Empty = same-origin `/api` (dev proxy + prod serving). Set it only if the backend lives on another origin (then also add the frontend origin to `CORS_ORIGIN`). |

## 8. Running the app

```sh
npm run dev          # backend :4000 + frontend :5173 (Vite proxies /api)
npm run dev:backend  # backend only (watch mode)
npm run dev:frontend # frontend only
```

**Production (single port):**

```sh
npm run build        # frontend → frontend/dist/
npm start            # backend serves the API + dist/ on :4000
```

**Docker (single container, persisted SQLite):**

```sh
JWT_SECRET=<long-random-string> docker compose up --build
# open http://localhost:4000
```

Add `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` to the environment for live AI.
Data persists in the `dashboard-ai-data` volume (`DATABASE_PATH=/data/app.db`).

## 9. Scripts reference

Root (`package.json`, npm workspaces):

| Script            | Runs                                                        |
| ----------------- | ----------------------------------------------------------- |
| `npm run dev`     | backend + frontend together (concurrently)                  |
| `npm run build`   | frontend production build                                   |
| `npm start`       | backend (serves API + `frontend/dist` when built)           |
| `npm test`        | backend `node:test` suite, then frontend vitest suite       |
| `npm run typecheck` | frontend `tsc --noEmit`                                   |
| `npm run lint`    | eslint over the repo (0 errors)                             |
| `npm run format`  | prettier `--write`                                          |

Frontend (`frontend/`): `dev` (`:5173`), `build`, `preview` (`:4173`),
`typecheck`, `lint`, `format`, `test`, `test:watch`.
Backend (`backend/`): `dev` (watch), `start`, `test`.

## 10. API reference

Envelope: success `{ "ok": true, "data": … }`, failure
`{ "ok": false, "error": "CODE", "message"?: "…" }`. Authenticated calls send
`Authorization: Bearer <jwt>`.

| Method & path                    | Auth | Description                                              |
| -------------------------------- | ---- | -------------------------------------------------------- |
| `GET /api/health`                | no   | `{ ai: "live" \| "demo", version }`                      |
| `POST /api/auth/register`        | no   | `{ email, password }` → `201 { token, user }`            |
| `POST /api/auth/login`           | no   | same, `401 INVALID_LOGIN` on mismatch                     |
| `GET /api/auth/me`               | yes  | current `{ id, email }`                                  |
| `GET /api/dashboards`            | yes  | own dashboards, newest first                             |
| `POST /api/dashboards`           | yes  | create (`201`); accepts a client `id` or mints a UUID    |
| `PUT /api/dashboards/:id`        | yes  | create-or-replace owned dashboard (sync + pre-login claim) |
| `GET /api/dashboards/:id`        | yes  | read owned (`404` otherwise — no existence leak)         |
| `DELETE /api/dashboards/:id`     | yes  | delete owned                                             |
| `GET /api/dashboards/shared/:id` | no   | read **published** dashboard only (`404` otherwise)      |
| `POST /api/ai/generate`          | yes  | `{ prompt, columns?, sample? }` → dashboard JSON        |
| `POST /api/ai/edit`              | yes  | `{ instruction, columns, theme, widgets }` → edited JSON |

Validation limits: email format + password 8–200 chars; prompt 2–2000 chars;
instruction 2–1000; widgets ≤ 60 per request; dashboard `name` 1–200 chars;
unknown dashboard shapes → `400 INVALID_DASHBOARD`; unconfigured AI →
`503 AI_NOT_CONFIGURED`; unknown `/api/*` → `404 NOT_FOUND`.

**Example session:**

```sh
B=http://localhost:4000
TOKEN=$(curl -s -X POST $B/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"you@company.com","password":"password123"}' | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>
console.log(JSON.parse(s).data.token))")

# create + publish
ID=$(curl -s -X POST $B/api/dashboards -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"name":"Q3 sales","theme":"midnight",
  "widgets":[],"dataset":{"name":"D","columns":["M"],"rows":[]},"filters":{}}' \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>
console.log(JSON.parse(s).data.id))")
curl -s -X PUT $B/api/dashboards/$ID -H "authorization: Bearer $TOKEN" \
  -H 'content-type: application/json' -d '{"name":"Q3 sales","theme":"midnight",
  "widgets":[],"dataset":{"name":"D","columns":["M"],"rows":[]},"filters":{},
  "published":true}' > /dev/null

# public link — no token needed
curl -s $B/api/dashboards/shared/$ID | head -c 120; echo
```

## 11. Data model

SQLite (`DATABASE_PATH`, default `backend/data/app.db`, gitignored):

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,            -- uuid
  email TEXT NOT NULL UNIQUE,     -- lowercased
  password_hash TEXT NOT NULL,    -- bcrypt
  created_at TEXT NOT NULL        -- ISO timestamp
);
CREATE TABLE dashboards (
  id TEXT PRIMARY KEY,            -- uuid (client may supply)
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,             -- 1–200 chars, mirrored in doc
  doc TEXT NOT NULL,              -- full dashboard JSON (widgets, dataset, versions…)
  published INTEGER NOT NULL DEFAULT 0,
  favorite  INTEGER NOT NULL DEFAULT 0,
  archived  INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL        -- server time, epoch ms inside doc
);
```

The `doc` JSON is the source of truth; the columns exist for listing,
sorting, and share gating. Back up the single `.db` file and you have
everything.

## 12. Auth & security model

- Passwords are bcrypt-hashed; the frontend only ever transmits them to
  `/api/auth/register|login` and stores just the JWT (`dashboard-ai:token`).
- Every dashboard row is owner-scoped server-side; cross-user reads return
  `404`, never `403` with metadata. The frontend is not the security
  boundary.
- AI provider keys live only in backend env; the browser bundle contains no
  `AI_*`, `JWT_*`, or password material (only the public `VITE_API_URL`).
- Uploads are validated (extension, 5 MB, row cap, parse errors surfaced);
  calculated columns accept only validated `[Column]` arithmetic; AI output is
  JSON-schema-checked (`sanitize.ts`) and never rendered as HTML.
- JWT secret: required in production (the server refuses to boot without
  it); in development a default is used with a loud warning.

## 13. AI setup

Any OpenAI-compatible chat-completions endpoint works (OpenAI, Azure OpenAI,
Ollama, vLLM, LiteLLM). Set all three on the backend:

```sh
# OpenAI
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-…
AI_MODEL=gpt-4o-mini

# Local Ollama (model must support JSON mode, e.g. llama3.1)
AI_BASE_URL=http://localhost:11434/v1
AI_API_KEY=ollama
AI_MODEL=llama3.1
```

Check `/api/health`: `"ai":"live"` means configured, `"demo"` means the
`503` path is active. Without configuration the app is fully usable —
generation and copilot edits fall back to deterministic local logic, every
result badged DEMO, computed insights still calculated from real data.

## 14. Testing

```sh
npm test            # both suites
npm test -w backend # node:test → test/api.test.js (temp DB, ephemeral port)
npm test -w frontend# vitest → routing + domain.test.ts (jsdom)
```

**Backend suite (9 tests):** health/demo flag; register normalization,
duplicate `409`, bad-login `401`, credential validation `400`; auth gating;
create/read/update/list/delete; unpublished-share `404`; user isolation;
AI auth requirement + `503 AI_NOT_CONFIGURED`.

**Frontend suite (16 tests):** route matching; aggregation/groupBy/filtering;
CSV (incl. quoted commas) + JSON parsing + readable rejections; auto-widget
construction; all-12-template loading with real column bindings; legacy-layout
upgrade guard (unedited upgrades, edited preserved); sanitizer allowlists;
grounded insights; demo keyword matching + demo copilot ops.

**Manual QA checklist** (also verified during development): register →
template → Studio edit → theme switch → `Ctrl+S` → reload persists → publish
→ private-window share link → save-a-copy → CSV import → visualize → save →
reload. See `docs/IMPLEMENTATION_LOG.md` for the last full run.

## 15. REAL vs DEMO vs NOT IMPLEMENTED

- **REAL:** auth, dashboard CRUD + cross-device sync, logged-out share links,
  template→Studio, Studio editing/undo/redo/autosave/versions, CSV/JSON
  import→visualize, cross-filtering, viewer + CSV export, 17 themes, command
  palette, search/filter/sort/favorites everywhere.
- **DEMO (labeled in UI):** generation/copilot output produced without a
  configured provider; all 12 seed datasets are synthetic.
- **NOT IMPLEMENTED:** comments/mentions, roles beyond owner-only, activity
  log, real-time collaboration, PNG/PDF export, live SQL/Sheets connectors,
  email flows (no password reset). The connector cards say SETUP REQUIRED and
  mean it.

## 16. Troubleshooting

| Symptom | Cause → fix |
| ------- | ----------- |
| `fetch failed / NETWORK` toasts | backend isn't running → `npm run dev:backend`; check `:4000/api/health`. Frontend on another origin without proxy → set `VITE_API_URL` + `CORS_ORIGIN`. |
| AI always makes DEMO dashboards | expected without provider → set `AI_*` and check `/api/health` says `"live"`; AI also requires sign-in (endpoints are auth-gated). |
| `401 UNAUTHORIZED` after deploy | token signed with a different/rotated `JWT_SECRET` → sign in again; keep one stable secret per deployment. |
| `JWT_SECRET … insecure default` warning | dev only → set a long random `JWT_SECRET`; production refuses to boot without it. |
| Share link says "isn't available" | dashboard isn't published, was deleted/unpublished, or the link points at another server's DB → Publish it and re-copy the link. |
| Port already in use (`EADDRINUSE`) | another dev server running → stop it or change `PORT` (frontend proxy assumes `:4000`; update `vite.config.ts` too). |
| `npm start` shows a blank page | `frontend/dist` missing/stale → run `npm run build` first; check `FRONTEND_DIST`. |
| `database is locked` | two writers colliding on SQLite under heavy parallel tests → WAL mode is on; normally transient, retry. Back up by copying the `.db` file while the server is stopped. |
| `tsc` complains about `routeTree.gen` | generated file missing → run `npm run dev -w frontend` or `build` once; never hand-edit it. |
| Docker build fails on `npm ci` | no `package-lock.json` for a workspace → the Dockerfile falls back to `npm i`; commit lockfiles to keep builds reproducible. |

## 17. Roadmap

Prioritized next work with acceptance criteria lives in
[`docs/ROADMAP.md`](docs/ROADMAP.md): computed Insight Center, AI
rate-limiting/usage logging, sharing polish, account management (password
change + delete with cascade), PNG/PDF export, gated live connectors. History
and past verification runs are in [`docs/IMPLEMENTATION_LOG.md`](docs/IMPLEMENTATION_LOG.md).

## 18. License

No license file ships with this repository yet — all rights reserved by
default. Add a `LICENSE` (e.g. MIT) before distributing or deploying publicly.
# DASHBOARD_AI_01
