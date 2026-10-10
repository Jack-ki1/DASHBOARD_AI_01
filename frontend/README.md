# DASHBOARD AI — frontend

React 19 + Vite + TanStack Router (SPA) + Tailwind CSS v4 + Recharts.
Talks to `../backend` over REST (`/api/*`). No backend code lives here —
AI keys and passwords never touch this bundle.

## Run

```sh
npm install
npm run dev        # :5173, /api proxied to http://localhost:4000
npm run build      # → dist/ (served by the backend in production)
npm run preview
npm run typecheck  # tsc --noEmit
npm run lint
npm test           # vitest
```

Copy `.env.example` to `.env` if the backend runs on another origin
(`VITE_API_URL=http://localhost:4000`).

## Layout

- `src/routes/` — file-based pages (`index`, `generate`, `templates`,
  `studio.$id`, `data`, `workspace`, `view.$id`, `auth`, `privacy`, `terms`)
- `src/components/` — Studio ribbon, charts, shadcn `ui/` primitives
- `src/lib/` — `api.ts` (backend client), `auth.tsx` (session),
  `store.ts` (local cache + cloud sync), dashboard domain
- `src/main.tsx` — SPA entry; `src/router.tsx` — router instance
