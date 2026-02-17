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
- Work board CRUD UI + mission linkage workflows
- Stage executor with repo/web/documentation adapters + trace writes
- Provider-backed planning/synthesis (OpenAI adapter with deterministic fallback)
- Artifact-evidence claim link persistence for recommendation provenance
- Editable recommendation outcomes in morning review UI

## Not yet implemented
- Strategic memory approval workflow
- Per-provider cost tracking + model policy by workflow

## Immediate next build tasks
1. Implement strategic memory approval + conflict workflow.
2. Add per-provider cost tracking and model selection policies by workflow.
3. Expose claim-link details and filters in replay/morning UI.
4. Add authority calibration update jobs from recommendation outcomes.
