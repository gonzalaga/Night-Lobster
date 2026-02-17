# Night Lobster MVP (Scaffold)

This repository contains the first implementation scaffold for the Night Lobster MVP:
- Chat session -> handoff envelope
- Night run queue + worker pipeline
- Morning review loop with outcome capture
- Compact web UI for mission setup and coffee-mode review
- Automatic nightly scheduler (9:00 PM local window)
- Replay endpoint + timeline view

## Stack
- Web: Next.js (`apps/web`)
- API + Worker: Fastify + BullMQ + Prisma (`apps/server`)
- DB: Postgres (+ pgvector image), Redis via Docker Compose
- Shared contracts: Zod schemas (`packages/contracts`)

## Defaults in this build
- Nightly run time: **9:00 PM local**
- Runtime budget: **120 minutes**
- Policy: **read/write with documentation**

## Quick Start
### One-command macOS setup

```bash
./scripts/setup-mac.sh
```

This script verifies/installs required dependencies on macOS (Homebrew, Node.js, Docker CLI, Colima), bootstraps env files, starts Postgres/Redis, installs npm dependencies, initializes Prisma, installs a `nightlobster` CLI command, and starts app services automatically.
You can rerun the same script for updates; it detects prior installs, performs an update flow, and restarts services cleanly.

### Service management CLI

```bash
nightlobster start
nightlobster stop
nightlobster restart
nightlobster status
nightlobster logs
```

### Manual setup
1. Install dependencies:

```bash
npm install
```

2. Start infra:

```bash
docker compose up -d
```

3. Configure env:

```bash
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.local.example apps/web/.env.local
```

`NIGHTLY_SCHEDULER_WINDOW_MINUTES` controls how many minutes after the configured hour the auto-scheduler can enqueue missions (default `10`).
Set `OPENAI_API_KEY` to enable provider-backed planning/synthesis. If unset, the worker uses deterministic fallback planning.

4. Generate Prisma client and push schema:

```bash
npm run db:generate -w @nightlobster/server
npm run db:push -w @nightlobster/server
```

5. Run server + web + worker in separate terminals:

```bash
npm run dev:server
npm run dev:web
npm run dev:worker
```

## Core flow
1. Open `http://localhost:3000/missions`
2. Create project + mission + handoff and queue run
3. Worker processes the run and creates `run_report`
4. Open `http://localhost:3000/morning` and submit review

## API highlights
- `POST /projects`
- `POST /missions`
- `POST /handoffs`
- `POST /runs/from-handoff`
- `GET /runs/:runId/replay`
- `GET /morning/:runId`
- `POST /morning/:runId/evaluation`
- `GET /work-items`
- `POST /work-items`
- `PATCH /work-items/:workItemId`
- `POST /work-items/:workItemId/link-mission`
- `GET /missions/:missionId/work-items`
- `POST /missions/:missionId/work-items`
- `GET /config/defaults`

## Notes
- Worker executes a real staged flow: intake -> plan -> execute -> synthesize -> handoff.
- Plan and synthesize stages are provider-backed via OpenAI (`OPENAI_MODEL`, default `gpt-4.1-mini`) with automatic fallback.
- Execute stage includes repository evidence gathering, optional web URL fetch from context, artifact generation, and scoped documentation write attempts.
- Recommendation claims are persisted with artifact-evidence links for provenance.
- Handoff and run-report contracts are validated through `@nightlobster/contracts`.
