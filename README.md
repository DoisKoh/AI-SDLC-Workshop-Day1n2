# Todo App

A feature-rich, passwordless todo application built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **better-sqlite3**, and **Tailwind CSS 4**. All date/time handling is in **Singapore time (Asia/Singapore)**.

Implements the 11 features specified in [`PRPs/README.md`](PRPs/README.md) and graded by [`EVALUATION.md`](EVALUATION.md):

1. Todo CRUD (title, due date, priority, recurring, reminders)
2. Priority system (High / Medium / Low, colour-coded, auto-sorted)
3. Recurring todos (daily / weekly / monthly / yearly; next instance on completion)
4. Reminders & browser notifications (7 timings, 30s polling, duplicate-safe)
5. Subtasks & progress tracking (cascade delete, live progress bar)
6. Tags (colour-coded, many-to-many, filtering)
7. Templates (save/reuse patterns, categories, subtasks)
8. Search & advanced filtering (title+subtask search, priority/tag/date/completion, saved presets)
9. Export / Import (JSON round-trip with relationships, CSV export)
10. Calendar view (monthly grid, Singapore public holidays, day modal, URL month state)
11. Authentication (WebAuthn / passkeys, JWT sessions, protected routes)

Plus: dark mode (system preference), overdue/pending/completed sections, real-time updates.

---

## Quick Start

> Requires **Node.js 20+**.

```bash
npm install           # install dependencies (builds the native better-sqlite3 module)
npm run seed          # seed Singapore public holidays (creates ./todos.db)
npm run dev           # start the dev server on http://localhost:3000
```

Open http://localhost:3000 — you'll be redirected to **/login**. Register a username and create a passkey (Touch ID / Windows Hello / a security key). On a Mac, Touch ID works out of the box on `localhost`.

No configuration is required for local development: sensible defaults are used and a `.env.local` is included. See [Environment Variables](#environment-variables) for production.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (http://localhost:3000) |
| `npm run build` | Production build |
| `npm start` | Start the production server (`PORT` env, default 3000) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run seed` | Seed Singapore public holidays (idempotent) |
| `npm test` | Unit tests (Vitest) |
| `npm run test:coverage` | Unit tests with coverage |
| `npm run test:e2e` | End-to-end tests (Playwright, virtual WebAuthn authenticator) |

---

## Testing

- **Unit tests (Vitest):** timezone/recurrence math, filtering & sectioning, sort order, and Zod validation — `tests/unit/`.
- **E2E tests (Playwright):** every feature exercised through real Chromium with a **virtual WebAuthn authenticator** and `Asia/Singapore` timezone — `tests/e2e/`. The Playwright config spins up its own dev server against an **isolated `test-todos.db`**, so tests never touch your dev data.

```bash
npm test           # 42 unit tests
npm run test:e2e   # 24 E2E tests (auth, CRUD, recurring, subtasks, tags, templates,
                   # search/filters, export/import, calendar)
```

Both suites pass green.

---

## Architecture

```
app/
  page.tsx              Main todo app (composes the components below)
  login/page.tsx        WebAuthn register/login
  calendar/page.tsx     Monthly calendar (URL ?month=YYYY-MM)
  layout.tsx, error.tsx, not-found.tsx
  hooks/useTodos.ts     Central client data + actions hook
  components/*.tsx       Presentational + container components (Header, TodoForm,
                         TodoItem, modals, SearchFilterBar, CalendarView, …)
  api/**/route.ts        REST API (auth, todos, subtasks, tags, templates,
                         notifications, holidays, export/import)
lib/
  db.ts + db/*.ts        SQLite data layer (one module per domain), single entry point
  timezone.ts            Singapore wall-clock <-> UTC conversions, recurrence, due labels
  filtering.ts, sort.ts  Pure filtering/sectioning + sort (unit-tested, client-safe)
  validation.ts          Zod schemas for all inputs
  session.ts             Edge-safe JWT (used by middleware)
  auth.ts, webauthn.ts   Cookie-bound session + WebAuthn helpers (server-only)
  api-client.ts, auth-client.ts   Typed browser clients
  testids.ts             data-testid registry shared by components and tests
middleware.ts            Route protection (/, /calendar -> /login when unauthenticated)
scripts/seed-holidays.ts Singapore public holiday seed (2025–2026)
```

**Design notes**

- Instants are stored as **UTC ISO strings**; `lib/timezone.ts` is the only place that converts to/from Singapore wall-clock time. Singapore is a fixed UTC+8 (no DST), so conversions are deterministic and round-trippable.
- The SQLite connection is **lazy** (opens on first query, not on import) so Next's build-time module scanning doesn't lock the file. WAL mode + foreign keys + busy-timeout are enabled.
- Every API route checks the session and scopes all queries to `session.userId` (no cross-user access). All SQL uses prepared statements.
- Sessions and WebAuthn challenges are signed JWTs in HTTP-only cookies (`Secure` + `SameSite=lax` in production).

---

## Environment Variables

Local dev works with the bundled defaults. For production, set these (see [`.env.example`](.env.example)):

| Variable | Purpose | Example |
|---|---|---|
| `JWT_SECRET` | Signs session & challenge JWTs (min 16 chars; **required** in production) | `openssl rand -base64 32` |
| `RP_ID` | WebAuthn Relying Party ID = your domain (no scheme/port) | `your-app.up.railway.app` |
| `RP_NAME` | Display name shown in the passkey prompt | `Todo App` |
| `RP_ORIGIN` | Full origin URL (scheme + host) | `https://your-app.up.railway.app` |
| `DATABASE_PATH` | Optional explicit SQLite path (defaults to `./todos.db`, or `$RAILWAY_VOLUME_MOUNT_PATH/todos.db`) | `/app/data/todos.db` |

> **WebAuthn note:** `RP_ID` and `RP_ORIGIN` must match the domain the app is served from, or registration/login will fail.

---

## Deployment

This app uses SQLite, which needs a **persistent disk**. **Railway** (with a volume) is recommended; configs for Railway (`railway.json`, `nixpacks.toml`, `Procfile`) and Vercel (`vercel.json`) are included.

See [`RAILWAY_DEPLOYMENT.md`](RAILWAY_DEPLOYMENT.md) / [`RAILWAY_SIMPLE_SETUP.md`](RAILWAY_SIMPLE_SETUP.md) for details. **Steps that require your account/credentials** are listed in [Human steps required](#human-steps-required-deployment).

⚠️ **Vercel caveat:** serverless functions have an ephemeral filesystem, so the SQLite DB resets on each deploy/scale. Use Railway with a volume for persistence (or migrate to a hosted DB).

---

## Human steps required (deployment)

These need a person with the relevant accounts — everything else (code, tests, local run, production build) is done and verified:

1. **Create a Railway account** and project at https://railway.app, then connect this GitHub repo (or `railway up` from the CLI).
2. **Add a Volume** in Railway, mount it (e.g. at `/app/data`), and set `DATABASE_PATH=/app/data/todos.db` so data persists across deploys.
3. **Set environment variables** in Railway: `JWT_SECRET` (random 32+ chars), `RP_ID` (your Railway domain), `RP_NAME`, `RP_ORIGIN` (full `https://…` URL).
4. **Seed holidays in production** once: run `npm run seed` via a Railway one-off command (with `DATABASE_PATH` pointing at the volume), or trigger it from a deploy hook.
5. **(Optional) Custom domain:** add it in Railway, update DNS, and update `RP_ID` / `RP_ORIGIN` to the new domain.
6. **(GitHub) Push & PR:** the working tree is committed locally on demand only — if you want CI/PR review, push the branch and open a PR (requires your GitHub auth).

After deploying, verify: register a passkey on the production domain, create/complete a recurring todo, and confirm data survives a redeploy.
