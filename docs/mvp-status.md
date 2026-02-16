# MVP Status

## Implemented
- Monorepo scaffold (web/server/contracts)
- Core DB schema from revised spec
- Handoff envelope validation
- Run contract generation from handoff
- Queue + worker pipeline
- Automatic 9:00 PM scheduler for scheduled missions
- Morning report retrieval + feedback submission
- Post-review scoring update
- Replay endpoint (`/runs/:runId/replay`) + timeline UI
- UI for mission setup and morning review
- Stage executor with repo/web/documentation adapters + trace writes
- Provider-backed planning/synthesis (OpenAI adapter with deterministic fallback)

## Not yet implemented
- Full evidence-artifact claim linking table writes
- Strategic memory approval workflow
- Work board CRUD UI

## Immediate next build tasks
1. Persist artifact-evidence claim links for every recommendation.
2. Implement explicit recommendation editing in morning UI.
3. Add work board CRUD and mission linkage workflows.
4. Add per-provider cost tracking and model selection policies by workflow.
