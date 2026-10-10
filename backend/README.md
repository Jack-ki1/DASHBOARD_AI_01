# DASHBOARD AI — backend

Express + SQLite (Node built-in `node:sqlite`, no native addons) + JWT auth.
Zero build step: plain JavaScript, `node src/index.js`.

## Run

```sh
npm install
cp .env.example .env   # then set JWT_SECRET (and AI_* for live AI)
npm run dev            # watch mode on :4000
npm start              # production
npm test               # node:test API suite (uses a temp database)
```

## API

All responses are `{ ok: true, data }` or `{ ok: false, error, message? }`.

| Method & path                    | Auth | Description                                |
| -------------------------------- | ---- | ------------------------------------------ |
| `GET /api/health`                | no   | `{ ai: "live" \| "demo" }`                 |
| `POST /api/auth/register`        | no   | `{ email, password }` → `{ token, user }`  |
| `POST /api/auth/login`           | no   | same                                       |
| `GET /api/auth/me`               | yes  | current user                               |
| `GET /api/dashboards`            | yes  | own dashboards, newest first               |
| `POST /api/dashboards`           | yes  | create (201)                               |
| `PUT /api/dashboards/:id`        | yes  | create-or-replace owned dashboard          |
| `GET /api/dashboards/:id`        | yes  | read owned (404 otherwise)                 |
| `DELETE /api/dashboards/:id`     | yes  | delete owned                               |
| `GET /api/dashboards/shared/:id` | no   | read **published** dashboard (share links) |
| `POST /api/ai/generate`          | yes  | `{ prompt, columns?, sample? }`            |
| `POST /api/ai/edit`              | yes  | `{ instruction, columns, theme, widgets }` |

Auth is a `Authorization: Bearer <jwt>` header. AI routes answer
`503 AI_NOT_CONFIGURED` without `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL`.

## Data

SQLite file at `DATABASE_PATH` (default `backend/data/`, gitignored):
`users(id, email, password_hash)` and
`dashboards(id, user_id, name, doc JSON, published, favorite, archived, timestamps)`.
