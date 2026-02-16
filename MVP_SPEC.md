# Night Lobster MVP Spec

## 1. Product Definition

Night Lobster is a focused autonomous product copilot.

It runs a strict daily loop:
1. Human daytime planning
2. Nightly autonomous execution and exploration
3. Morning decision handoff
4. Human reprioritization

The MVP is not a general chat assistant. It is a bounded job runner that produces decision-ready output.
It optimizes for concrete progress, not documentation volume.

## 2. Goals and Non-Goals

### Goals
- Execute one or more scoped missions overnight using explicit constraints.
- Produce high-signal morning briefs with ranked recommendations.
- Preserve memory across runs (decisions, facts, experiments, evidence).
- Minimize drift via scoring and stop conditions.
- Keep morning review lightweight and actionable (coffee-length by default).

### Non-Goals (MVP)
- Real-time autonomous behavior during the day.
- Full multi-agent orchestration.
- Fully automatic roadmapping with no human review.
- Broad enterprise integrations beyond a small starter set.
- Multi-page PM deliverables as default outputs.

## 3. Core Primitives

### Purpose
Stable statement of why this project exists and what success looks like.

### Goals
Versioned goals at three horizons:
- Long-term (quarter+ outcomes)
- Medium-term (month outcomes)
- Short-term (weekly sprint outcomes)

### Workflow
Explicit lifecycle stages for each mission:
- Intake -> Plan -> Execute -> Synthesize -> Handoff -> Archive

### Memory
- Episodic: run logs, actions, outcomes, timestamps
- Semantic: durable product/domain facts
- Strategic: decisions, assumptions, constraints, risk posture

### Heartbeat
Scheduled nightly execution with guardrails:
- Start/end window
- Time budget
- Token budget
- Tool/permission budget
- Hard stop conditions

### Soul (Behavior Profile)
PM archetype policy that shapes choices:
- Prioritize user impact and decision usefulness
- Prefer reversible experiments first
- Surface tradeoffs and confidence levels
- Avoid work with weak goal linkage
- Prefer shippable slices and test plans over long-form narrative docs

### Adaptive Authority
The agent earns assertiveness through demonstrated domain competence.
- Expertise accrual: build measurable project/domain knowledge over time.
- Authority escalation: increase assertion level only when thresholds are met.
- Authority de-escalation: reduce assertiveness when quality or calibration drops.
- Policy gates: never escalate based on style; only on tracked outcomes and evidence.

## 4. MVP User Journey

### Daytime setup (5-15 min)
- User sets or updates purpose/goals.
- User creates tonight’s mission(s): objective, constraints, success criteria.
- User confirms allowed tools and repo/workspace scope.

### Overnight run (autonomous)
- System validates mission against policies.
- Executes mission workflow with checkpoints.
- Stores evidence and memory updates.
- Produces morning brief and decision queue.

### Morning review (5-10 min)
- User reads a compact brief.
- Accepts/rejects proposed next actions.
- Approves updates to goal priorities.

## 5. System Architecture (MVP)

### 5.1 Components
- Planner Service: converts mission input into executable run plan.
- Orchestrator: runs stage machine, enforces heartbeat and budgets.
- Tool Gateway: controlled execution (web, code, docs, APIs).
- Memory Service: store/retrieve episodic, semantic, strategic memory.
- Context Compiler: distills chat context into a stable handoff contract.
- Scoring Engine: computes run quality and drift metrics.
- Expertise Engine: computes per-domain competence and authority level.
- Brief Generator: produces compact morning briefs and bounded artifacts.
- UI Layer: mission setup, run status, morning review.

### 5.2 High-Level Flow
1. Mission created in UI.
2. Planner builds run contract.
3. Orchestrator executes staged tasks.
4. Tool results and notes written to memory.
5. Scoring engine evaluates run quality.
6. Brief generator produces summary + decisions required.
7. Run report rehydrates next chat session with only high-signal deltas.

## 6. Data Model (Minimal)

### `projects`
- `id`
- `name`
- `purpose`
- `created_at`
- `updated_at`

### `goals`
- `id`
- `project_id`
- `horizon` (`short|medium|long`)
- `statement`
- `metric`
- `target_date`
- `priority`
- `status`
- `version`

### `missions`
- `id`
- `project_id`
- `title`
- `objective`
- `constraints_json`
- `success_criteria_json`
- `status`
- `scheduled_for`

### `runs`
- `id`
- `mission_id`
- `started_at`
- `ended_at`
- `status`
- `time_budget_sec`
- `token_budget`
- `score_json`

### `run_steps`
- `id`
- `run_id`
- `stage` (`intake|plan|execute|synthesize|handoff`)
- `action`
- `artifact_ref`
- `result_summary`
- `confidence`
- `timestamp`

### `memory_items`
- `id`
- `project_id`
- `type` (`episodic|semantic|strategic`)
- `content`
- `source_run_id`
- `confidence`
- `tags_json`
- `created_at`

### `expertise_scores`
- `id`
- `project_id`
- `domain_key`
- `competence_score` (0-1)
- `calibration_score` (0-1)
- `coverage_score` (0-1)
- `last_evaluated_at`
- `evidence_count_30d`
- `authority_level` (`suggest|recommend|assert|autonomous_limited`)
- `status` (`active|degraded|cold_start`)

### `decisions`
- `id`
- `project_id`
- `run_id`
- `question`
- `options_json`
- `recommendation`
- `rationale`
- `required_by`
- `status`

### `handoffs`
- `id`
- `project_id`
- `thread_id`
- `mission_id`
- `source_provider` (`chatgpt|codex|other`)
- `target_mode` (`night_run|chat`)
- `envelope_json`
- `status`
- `created_at`

### `run_reports`
- `id`
- `run_id`
- `project_id`
- `handoff_id`
- `report_json`
- `summary_text`
- `created_at`

## 7. Nightly Run Contract

Each run should execute against a strict contract object.

```json
{
  "project_id": "proj_123",
  "mission_id": "mis_456",
  "objective": "Validate top 2 onboarding hypotheses",
  "domain_scope": ["onboarding", "activation"],
  "goal_links": ["goal_short_1", "goal_medium_2"],
  "constraints": {
    "max_runtime_minutes": 120,
    "max_tokens": 120000,
    "allowed_tools": ["web_research", "repo_read", "repo_write"],
    "forbidden_actions": ["deploy_prod", "send_external_email", "unrequested_longform_docs"]
  },
  "success_criteria": [
    "At least 3 high-quality evidence sources",
    "Two concrete experiment specs",
    "One ranked recommendation"
  ],
  "stop_conditions": [
    "budget_exhausted",
    "confidence_stagnation",
    "insufficient_evidence"
  ],
  "output_requirements": {
    "morning_brief": true,
    "decision_queue": true,
    "artifacts": ["decision_memo", "experiment_card", "optional_build_slice"],
    "artifact_limits": {
      "max_artifacts": 3,
      "max_words_per_artifact": 300
    },
    "brief_style": "coffee_mode",
    "max_morning_read_minutes": 5
  },
  "authority_policy": {
    "start_level": "suggest",
    "max_level_this_run": "recommend",
    "allow_autonomous_write_actions": false,
    "escalation_mode": "threshold_gated"
  }
}
```

### 7.1 `HandoffEnvelope` Schema (Chat -> Night Run)

```json
{
  "handoff_id": "han_789",
  "project_id": "proj_123",
  "thread_id": "thr_456",
  "mission_id": "mis_456",
  "source_provider": "chatgpt",
  "objective": "Validate top 2 onboarding hypotheses",
  "goal_links": ["goal_short_1", "goal_medium_2"],
  "decisions_already_made": [
    "Target segment is self-serve teams < 20 seats"
  ],
  "open_questions": [
    "Which onboarding checkpoint drives activation most?"
  ],
  "must_use_context": [
    {
      "fact": "Activation metric is defined as first successful import",
      "source_ref": "thread:thr_456#msg_102"
    }
  ],
  "constraints": {
    "max_runtime_minutes": 120,
    "allowed_tools": ["web_research", "repo_read", "repo_write"],
    "forbidden_actions": ["deploy_prod", "send_external_email", "unrequested_longform_docs"]
  },
  "success_criteria": [
    "At least 3 high-quality evidence sources",
    "One ranked recommendation",
    "Top 3 user decisions required"
  ],
  "authority_policy": {
    "start_level": "suggest",
    "max_level_this_run": "recommend",
    "allow_autonomous_write_actions": false
  }
}
```

## 8. Morning Brief Contract

Required sections:
- Mission objective and why it matters now
- Work completed (3 bullets max)
- New evidence discovered (3 bullets max)
- Confidence delta (before vs after)
- Current authority level and why it was retained/escalated/de-escalated
- Recommended actions (top 3 ranked)
- Decisions needed from user (top 3)
- Risks and unknowns (top 3)

Target length:
- Coffee mode default: <= 400 words, <= 5 minutes to read
- Expandable detail view with linked evidence, opened only on demand

### 8.1 `RunReport` Schema (Night Run -> Chat)

```json
{
  "report_id": "rep_222",
  "run_id": "run_111",
  "project_id": "proj_123",
  "handoff_id": "han_789",
  "mission_status": "completed",
  "objective_result": "Partially validated",
  "delta_summary": [
    "Identified one high-leverage onboarding checkpoint",
    "Found conflicting evidence in SMB cohorts"
  ],
  "recommended_actions_top3": [
    "Run checkpoint timing A/B test",
    "Instrument activation step with event metadata",
    "Scope one implementation slice for guided import"
  ],
  "decisions_needed_top3": [
    "Choose experiment success threshold",
    "Approve event schema change",
    "Prioritize guided import slice for next sprint"
  ],
  "memory_updates": {
    "semantic_refs": ["mem_sem_1", "mem_sem_2"],
    "strategic_refs": ["mem_str_7"]
  },
  "authority_update": {
    "domain_key": "onboarding",
    "previous_level": "suggest",
    "current_level": "recommend",
    "reason": "3 consecutive non-degraded runs with strong calibration"
  },
  "follow_on_handoff_ready": true
}
```

## 9. Scoring and Anti-Drift Guardrails

Compute a `run_score` from four dimensions:
- Goal Alignment (0-1): percent of actions tied to current goals
- Evidence Quality (0-1): source quality and triangulation
- Novelty (0-1): non-duplicate useful findings
- Decision Impact (0-1): usefulness for tomorrow’s choices

`run_score = 0.35 * alignment + 0.25 * evidence + 0.15 * novelty + 0.25 * decision_impact`

Hard guardrails:
- Abort if no goal links are provided.
- Abort if >40% actions are low-value/repetitive.
- Downgrade confidence when evidence is single-source.
- Flag run when recommendations lack explicit tradeoffs.
- Penalize documentation-heavy output with low decision utility.

## 10. Adaptive Authority Model

Authority levels:
- `suggest`: offers options with low-confidence framing.
- `recommend`: proposes a preferred path with explicit tradeoffs.
- `assert`: strongly advocates a path and flags alternatives as lower expected value.
- `autonomous_limited`: can execute pre-approved actions within strict guardrails.

Escalation thresholds (per domain):
- Escalate only if `competence_score >= 0.75`, `calibration_score >= 0.70`, and `evidence_count_30d >= 12`.
- Escalate only after at least 3 consecutive non-degraded runs in that domain.
- Never escalate more than one level per 7-day window.

De-escalation triggers:
- Two degraded runs in a 7-day window.
- Recommendation reversal rate > 35% over trailing 10 decisions.
- Material contradiction found in strategic memory for active domain guidance.

Policy gates:
- `assert` and `autonomous_limited` require explicit run-level permission in `authority_policy`.
- Autonomous write actions are allowed only when `allow_autonomous_write_actions` is true.
- Low recency domains (no quality evidence in 30 days) are forced back to `suggest`.

## 11. First 3 Workflows to Implement

### Workflow A: Exploratory Research Sprint
Input: product question + constraints.
Output: evidence map, opportunity list, recommended next experiment.

Stages:
1. Clarify hypotheses
2. Gather and grade evidence
3. Synthesize options and tradeoffs
4. Propose next-step experiments

### Workflow B: Decision Memo + Experiment Card
Input: problem statement + target user + success metric.
Output: one short decision memo and one experiment card.

Stages:
1. Problem framing
2. User/jobs-to-be-done pass
3. Solution option generation
4. Scope shaping for one testable slice
5. Decision memo + experiment card synthesis

### Workflow C: Concept Build Spike
Input: concept hypothesis + technical constraints.
Output: one concrete build slice and a verification note.

Stages:
1. Define smallest viable slice to build tonight
2. Implement or scaffold the slice
3. Run quick verification checks
4. Return what works, what broke, and next iteration move

## 12. Suggested MVP Stack

- Backend: TypeScript + Node.js (fast iteration)
- DB: Postgres + pgvector (for memory retrieval)
- Queue/Jobs: BullMQ or Temporal (if higher reliability needed)
- Orchestration: explicit finite-state workflow engine
- Frontend: Next.js dashboard (mission setup + morning review)
- LLM providers: start with ChatGPT/Codex, keep provider adapter for later multi-model support

## 13. Build Plan (4 Weeks)

### Week 1
- Implement core schema and mission/run APIs.
- Build run contract validator.
- Implement manual trigger for a single mission.
- Implement Context Compiler and `HandoffEnvelope` creation from chat.

### Week 2
- Build orchestrator stage machine.
- Add memory writes/reads and simple retrieval.
- Generate first morning brief artifact.
- Enforce coffee-mode output limits.
- Emit `RunReport` artifacts and enable one-click continuation to chat.

### Week 3
- Add scoring engine and anti-drift checks.
- Implement expertise scoring and authority escalation/de-escalation rules.
- Implement Workflow A end-to-end.
- Add audit logs and run replay view.

### Week 4
- Implement Workflows B and C.
- Add scheduling heartbeat and budget enforcement.
- Tighten morning review UX and decision queue.
- Add authority explanation UI in morning brief and review flow.
- Add artifact-size guardrails and reject overlong outputs by default.

## 14. MVP Exit Criteria

MVP is successful when:
- At least 10 nightly runs complete without manual intervention.
- Morning brief is rated useful on >= 70% of runs.
- >= 60% of recommendations are accepted or adapted by user.
- Drift alerts catch low-value runs before completion.
- Authority level changes are accepted by user review on >= 80% of transitions.
- <= 10% of runs produce overlong outputs that violate coffee-mode limits.

## 15. Open Decisions

- How aggressive should autonomy be by default (conservative vs proactive)?
- Should repo-write actions require explicit per-run approval?
- What minimum evidence standard should be enforced per mission type?
- How many concurrent missions are allowed in MVP (likely 1)?
- Should authority be tracked per domain only, or per domain + workflow type?

## 16. Seamless Handoff Rules

- Use `HandoffEnvelope` as the only input to night runs; do not pass full transcripts.
- Use `RunReport` as the default morning re-entry payload for chat.
- Keep memory and handoff state external to chat threads.
- Preserve stable IDs across modes: `project_id`, `thread_id`, `mission_id`, `handoff_id`.
- Require one-click user confirmation before each nightly run starts.
- On morning re-entry, inject only delta summary, decisions needed, and memory refs.
