# ROADMAP — DASHBOARD AI (monorepo)

Done: monorepo split (`frontend/` SPA + `backend/` Express/SQLite/JWT),
own auth, dashboard sync, public share links, pluggable AI with honest demo
fallback, 12 templates, 17 themes, CSV/JSON import, command palette,
viewer exports, 16 frontend + 9 backend tests, Docker single-container deploy.

## Next (prioritized, with acceptance criteria)

1. **Computed Insight Center** — surface `computeInsights` as a Studio panel
   with period compare + outlier cards. AC: cards quote real numbers, each
   with metric + limitation; empty state when data is insufficient.
2. **AI provider hardening** — retry/backoff, per-user rate limits, token
   usage logging. AC: 429s from provider map to friendly messages; abuse
   can't loop the endpoint (auth + limits).
3. **Sharing polish** — unpublish, link regeneration, copy-link button state.
   AC: unpublish immediately 404s the share URL (test covers it).
4. **Account management** — change password + delete account (with data wipe).
   AC: deleting removes user row + all dashboards (cascade verified by test).
5. **PNG/PDF export** — client-side canvas capture of the report sheet.
   AC: export matches on-screen theme; large dashboards don't OOM a laptop.
6. **Live connectors (gated)** — server-side Sheets/Postgres/REST sync jobs
   behind the documented boundary. AC: no credentials in the browser, ever;
   connector cards only flip from SETUP REQUIRED when configured.

## Explicitly deferred (gated, not faked)

Comments/mentions, roles/RBAC beyond owner-only, activity log, real-time
collab, email flows, template marketplace publishing.
