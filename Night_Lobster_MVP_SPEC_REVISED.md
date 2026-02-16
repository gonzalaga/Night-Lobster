# Night Lobster MVP Spec (Revised)

## 0. Version Notes

This revision strengthens the MVP in six critical ways:

1. **Closed-loop learning**: structured morning review → outcomes → scoring + authority calibration.
2. **Provenance**: artifacts and evidence are first-class; claims tie back to evidence.
3. **Traceability & replay**: deterministic run traces, tool invocations, memory diffs, “why this?” explainer.
4. **Permissions & side-effects**: tool capabilities, scopes, approval gates, sandbox boundaries.
5. **Memory governance**: write rules, conflict handling, decay/archival, and approval for strategic changes.
6. **Continuity**: a persistent work graph (work items) and an assumption registry + branching rules for unattended runs.

---

## 1. Product Definition

Night Lobster is a focused autonomous product copilot.

It runs a strict daily loop:
1. Human daytime planning
2. Nightly autonomous execution and exploration
3. Morning decision handoff
4. Human reprioritization + feedback capture
5. System updates scores/authority/memory based on outcomes

The MVP is not a general chat assistant. It is a bounded job runner that produces decision-ready output with auditable provenance and replayable traces.

It optimizes for concrete progress, not documentation volume.

---

## 2. Goals and Non-Goals

### Goals
- Execute one or more scoped missions overnight using explicit constraints.
- Produce high-signal morning briefs with ranked recommendations and evidence-backed claims.
- Preserve memory across runs (decisions, facts, experiments, evidence, outcomes).
- Minimize drift via scoring, stop conditions, and assumption/branching rules.
- Keep morning review lightweight and actionable (coffee-length by default).
- Improve over time via explicit outcome signals (accept/reject/modify, usefulness, corrections).

### Non-Goals (MVP)
- Real-time autonomous behavior during the day.
- Full multi-agent orchestration.
- Fully automatic roadmapping with no human review.
- Broad enterprise integrations beyond a small starter set.
- Multi-page PM deliverables as default outputs.
- “Black box” autonomy with no trace/replay.

---

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
- Intake → Plan → Execute → Synthesize → Handoff → Archive

### Memory
- **Episodic**: run logs, actions, outcomes, timestamps, tool traces
- **Semantic**: durable product/domain facts, grounded in evidence when possible
- **Strategic**: decisions, constraints, risk posture, operating principles

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
- Label hypothesis vs evidence-backed claims explicitly

### Adaptive Authority
The agent earns assertiveness through demonstrated competence **measured by outcomes**.

- Expertise accrual: build measurable project/domain knowledge over time.
- Authority escalation: increase assertion level only when thresholds are met.
- Authority de-escalation: reduce assertiveness when quality or calibration drops.
- Policy gates: never escalate based on style; only on tracked outcomes and evidence.
- Reversal and acceptance rates are measured and used to adjust authority.

### Provenance
Everything “decision-grade” must have receipts:
- **Artifacts**: durable outputs (memos, experiment cards, code diffs)
- **Evidence**: sources, excerpts, quality grading, retrieval time
- **Claim links**: key claims link to evidence items or are marked as hypotheses

### Traceability
Every run is replayable:
- Plan versions, tool invocations, intermediate decisions/confidence, memory diffs
- “Why this?” explainers for recommendations

### Work Graph
Persistent continuity layer:
- work items (backlog/in-progress/blocked/done)
- missions attach to work items and update them
- run outputs are linked to work items for retrieval later

### Assumptions Registry
Unattended execution needs explicit rules for ambiguity:
- record assumptions with confidence + impact
- branch cheaply when helpful
- convert blockers into “Decisions Needed” and redirect remaining budget to other valuable tasks

---

## 4. MVP User Journey

### Daytime setup (5–15 min)
- User sets or updates purpose/goals.
- User creates tonight’s mission(s): objective, constraints, success criteria.
- User confirms allowed tools and repo/workspace scope.
- (Optional) User selects work item(s) the mission is intended to advance.

### Overnight run (autonomous)
- System validates mission against policies, permissions, and budgets.
- Executes mission workflow with checkpoints.
- Stores evidence, artifacts, trace, and memory updates (subject to governance).
- Produces morning brief, decision queue, and a compact “review strip” template.

### Morning review (5–10 min)
- User reads a compact brief (coffee mode).
- User answers “decisions needed.”
- User accepts/modifies/rejects recommended actions.
- User rates usefulness/trust/brevity and optionally flags issues.
- System commits outcome signals → updates scoring/authority calibration/memory.

---

## 5. System Architecture (MVP)

### 5.1 Components
- **Planner Service**: converts mission input into executable run plan.
- **Orchestrator**: runs stage machine, enforces heartbeat and budgets.
- **Tool Gateway**: controlled execution (web, code, docs, APIs) with capability descriptors.
- **Permission & Sandbox Service**: enforces read/write scopes, approvals, side-effect constraints, secret handling.
- **Memory Service**: store/retrieve episodic, semantic, strategic memory with governance rules.
- **Artifact Store**: stores generated artifacts with stable IDs, formats, summaries.
- **Evidence Registry**: stores evidence items, quality grades, excerpts, timestamps.
- **Trace Store**: stores tool invocations, plan versions, decision checkpoints, memory diffs.
- **Context Compiler**: distills chat context into a stable handoff contract.
- **Scoring Engine**: computes run quality, drift metrics, and post-review outcome scores.
- **Expertise Engine**: computes per-domain competence, calibration, coverage, authority level.
- **Brief Generator**: produces compact morning briefs and bounded artifacts with citations.
- **Feedback Capture**: turns morning review into structured outcomes.
- **UI Layer**: mission setup, run status, replay view, morning review, work board.

### 5.2 High-Level Flow
1. Mission created in UI (optionally linked to work items).
2. Planner builds run contract (+ permission descriptors + output requirements).
3. Orchestrator executes staged tasks.
4. Tool results, evidence, artifacts, trace written as first-class objects.
5. Memory writes happen via governance rules (some may require approval).
6. Brief generator produces summary + decisions required + assumptions list.
7. Morning review captures outcomes → Scoring + Expertise update.
8. Run report + outcomes rehydrate next session with high-signal deltas.

---

## 6. Data Model (Minimal + Additions)

### 6.1 Existing Core Tables

#### `projects`
- `id`
- `name`
- `purpose`
- `created_at`
- `updated_at`

#### `goals`
- `id`
- `project_id`
- `horizon` (`short|medium|long`)
- `statement`
- `metric`
- `target_date`
- `priority`
- `status`
- `version`

#### `missions`
- `id`
- `project_id`
- `title`
- `objective`
- `constraints_json`
- `success_criteria_json`
- `status`
- `scheduled_for`

#### `runs`
- `id`
- `mission_id`
- `started_at`
- `ended_at`
- `status`
- `time_budget_sec`
- `token_budget`
- `score_json` (pre-review + post-review)

#### `run_steps`
- `id`
- `run_id`
- `stage` (`intake|plan|execute|synthesize|handoff`)
- `action`
- `artifact_ref`
- `result_summary`
- `confidence`
- `timestamp`

#### `memory_items`
- `id`
- `project_id`
- `type` (`episodic|semantic|strategic`)
- `content`
- `source_run_id`
- `confidence`
- `tags_json`
- `created_at`
- `evidence_refs_json` (optional)
- `status` (`active|superseded|contested|archived`)
- `supersedes_id` (optional)

#### `expertise_scores`
- `id`
- `project_id`
- `domain_key`
- `competence_score` (0–1)
- `calibration_score` (0–1)
- `coverage_score` (0–1)
- `last_evaluated_at`
- `evidence_count_30d`
- `authority_level` (`suggest|recommend|assert|autonomous_limited`)
- `status` (`active|degraded|cold_start`)

#### `decisions`
- `id`
- `project_id`
- `run_id`
- `question`
- `options_json`
- `recommendation`
- `rationale`
- `required_by`
- `status` (`open|answered|deferred|invalid`)
- `answer_json` (optional)
- `answered_at` (optional)

#### `handoffs`
- `id`
- `project_id`
- `thread_id`
- `mission_id`
- `source_provider` (`chatgpt|codex|other`)
- `target_mode` (`night_run|chat`)
- `envelope_json`
- `status`
- `created_at`

#### `run_reports`
- `id`
- `run_id`
- `project_id`
- `handoff_id`
- `report_json`
- `summary_text`
- `created_at`

### 6.2 New Tables (Provenance, Trace, Feedback, Continuity)

#### `artifacts`
- `id`
- `run_id`
- `project_id`
- `type` (`decision_memo|experiment_card|code_diff|research_brief|verification_note`)
- `title`
- `format` (`md|pdf|json|patch`)
- `storage_uri`
- `summary`
- `created_at`

#### `evidence_items`
- `id`
- `run_id`
- `project_id`
- `kind` (`web|repo|doc|benchmark|interview_note|metric_snapshot`)
- `citation` (URL/path + locator)
- `retrieved_at`
- `quality_score` (0–1)
- `excerpt` (short)
- `notes` (short)

#### `artifact_evidence_links`
- `artifact_id`
- `evidence_id`
- `claim_id` (optional stable claim key)
- `support_strength` (`weak|medium|strong`)

#### `tool_invocations`
- `id`
- `run_id`
- `step_id`
- `tool_name`
- `request_json`
- `response_ref` (pointer/blob id)
- `status` (`ok|error|timeout|denied`)
- `error_text` (optional)
- `started_at`
- `ended_at`
- `cost_estimate_json` (tokens, $)

#### `plan_versions`
- `id`
- `run_id`
- `version`
- `plan_json`
- `created_at`

#### `memory_diffs`
- `id`
- `run_id`
- `before_ref`
- `after_ref`
- `diff_summary`
- `approval_required` (bool)
- `approved_at` (optional)

#### `run_evaluations`
- `id`
- `run_id`
- `project_id`
- `capture_status` (`pending|submitted|timeout`)
- `usefulness_rating` (1–5, optional until submitted)
- `brevity_rating` (1–5, optional until submitted)
- `trust_rating` (1–5, optional until submitted)
- `notes` (optional)
- `flagged_issue_types_json` (optional)
- `due_at` (optional)
- `created_at`

#### `recommendation_outcomes`
- `id`
- `run_id`
- `recommendation_id` (stable within report)
- `outcome` (`pending|accepted|modified|rejected|deferred`)
- `reason` (optional)
- `created_at`

#### `assumptions`
- `id`
- `run_id`
- `project_id`
- `statement`
- `confidence` (0–1)
- `impact_if_wrong` (`low|medium|high`)
- `evidence_refs_json` (optional)
- `needs_confirmation` (bool)
- `resolved_status` (`open|confirmed|rejected|superseded`)
- `resolved_at` (optional)

#### `work_items`
- `id`
- `project_id`
- `title`
- `type` (`bug|feature|research|tech_debt|ops`)
- `status` (`backlog|in_progress|blocked|done`)
- `priority` (int)
- `goal_links_json`
- `links_json` (repo paths, docs, external ids)
- `next_step`
- `owner` (`agent|human`)
- `updated_at`

#### `mission_work_links`
- `mission_id`
- `work_item_id`

#### `memory_conflicts`
- `id`
- `project_id`
- `conflicting_memory_ids_json`
- `summary`
- `impact` (`low|medium|high`)
- `recommended_resolution`
- `status` (`open|resolved`)
- `created_at`
- `resolved_at` (optional)

---

## 7. Nightly Run Contract

Each run executes against a strict contract object.

```json
{
  "project_id": "proj_123",
  "mission_id": "mis_456",
  "objective": "Validate top 2 onboarding hypotheses",
  "domain_scope": ["onboarding", "activation"],
  "goal_links": ["goal_short_1", "goal_medium_2"],
  "work_item_links": ["work_101", "work_205"],
  "constraints": {
    "max_runtime_minutes": 120,
    "max_tokens": 120000,
    "tool_policy": {
      "allowed_tools": ["web_research", "repo_read", "repo_write_pr"],
      "denied_tools": ["prod_deploy", "external_email"],
      "scopes": {
        "repo_write_pr": {
          "allowed_paths": ["apps/web/**", "packages/ui/**"],
          "max_files_changed": 20,
          "max_diff_lines": 800,
          "requires_approval": "pre_run_batch"
        },
        "web_research": {
          "allowed_domains": ["*"],
          "max_requests": 60
        }
      }
    },
    "forbidden_actions": [
      "deploy_prod",
      "send_external_email",
      "unrequested_longform_docs",
      "direct_push_main"
    ]
  },
  "success_criteria": [
    "At least 3 high-quality evidence sources",
    "Two concrete experiment specs",
    "One ranked recommendation"
  ],
  "stop_conditions": [
    "budget_exhausted",
    "confidence_stagnation",
    "insufficient_evidence",
    "permission_denied_repeated"
  ],
  "provenance_requirements": {
    "min_evidence_items": 3,
    "claims_must_link_evidence": true,
    "allow_hypotheses": true,
    "hypotheses_must_be_labeled": true
  },
  "assumption_policy": {
    "max_open_assumptions": 3,
    "branch_if_impact_high_and_cost_low": true,
    "when_blocked_convert_to_decision": true
  },
  "output_requirements": {
    "morning_brief": true,
    "decision_queue": true,
    "artifacts": ["decision_memo", "experiment_card", "code_diff"],
    "artifact_limits": {
      "max_artifacts": 3,
      "max_words_per_artifact": 300
    },
    "brief_style": "coffee_mode",
    "max_morning_read_minutes": 5
  },
  "trace_requirements": {
    "record_tool_invocations": true,
    "record_plan_versions": true,
    "record_memory_diffs": true,
    "why_this_explainers": true
  },
  "authority_policy": {
    "start_level": "suggest",
    "max_level_this_run": "recommend",
    "allow_autonomous_write_actions": true,
    "escalation_mode": "threshold_gated"
  },
  "feedback_requirements": {
    "collect_run_evaluation": true,
    "collect_recommendation_outcomes": true
  }
}
```

### 7.1 `HandoffEnvelope` Schema (Chat → Night Run)

Additions:
- `work_item_links`
- `assumptions_in_play` (optional)
- `tool_policy.scopes`
- `provenance_requirements`
- `assumption_policy`

```json
{
  "handoff_id": "han_789",
  "project_id": "proj_123",
  "thread_id": "thr_456",
  "mission_id": "mis_456",
  "source_provider": "chatgpt",
  "target_mode": "night_run",
  "objective": "Validate top 2 onboarding hypotheses",
  "goal_links": ["goal_short_1", "goal_medium_2"],
  "work_item_links": ["work_101"],
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
    "tool_policy": {
      "allowed_tools": ["web_research", "repo_read", "repo_write_pr"],
      "scopes": {
        "repo_write_pr": {
          "allowed_paths": ["apps/web/**"],
          "requires_approval": "pre_run_batch"
        }
      }
    },
    "forbidden_actions": ["deploy_prod", "send_external_email", "unrequested_longform_docs"]
  },
  "provenance_requirements": {
    "min_evidence_items": 3,
    "claims_must_link_evidence": true
  },
  "assumption_policy": {
    "max_open_assumptions": 3,
    "when_blocked_convert_to_decision": true
  },
  "success_criteria": [
    "At least 3 high-quality evidence sources",
    "One ranked recommendation",
    "Top 3 user decisions required"
  ],
  "authority_policy": {
    "start_level": "suggest",
    "max_level_this_run": "recommend",
    "allow_autonomous_write_actions": true
  }
}
```

---

## 8. Morning Brief Contract

Required sections (coffee mode):
- Mission objective and why it matters now
- Work completed (≤ 3 bullets)
- New evidence discovered (≤ 3 bullets, each with evidence ID/link)
- Key recommendations (top 3, ranked) with tradeoffs + confidence
- Decisions needed from user (top 3)
- Assumptions made (≤ 3) + “impact if wrong”
- Risks and unknowns (≤ 3)
- Authority level + change rationale (if changed)
- What the agent will do next if no further input is provided (bounded)

Target length:
- Coffee mode default: ≤ 400 words, ≤ 5 minutes to read
- Expandable detail view:
  - artifacts list
  - evidence list
  - trace/replay timeline
  - “why this?” explainers

### 8.1 Morning Review Strip (Feedback Capture)

The morning review UI must capture, at minimum:
- Run usefulness rating (1–5)
- Brevity rating (1–5)
- Trust rating (1–5)
- For each recommendation: Accepted / Modified / Rejected / Deferred (+ optional reason)
- Optional: “incorrect fact” / “unsafe behavior” flags and notes

This generates `run_evaluations` and `recommendation_outcomes`.

### 8.2 `RunReport` Schema (Night Run → Chat)

Additions:
- artifact refs
- evidence refs
- assumptions
- trace refs
- recommended actions include stable `recommendation_id`

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
  "evidence_refs": ["ev_1", "ev_2", "ev_3"],
  "artifact_refs": ["art_10", "art_11"],
  "assumptions": [
    {
      "statement": "Most activation dropoff occurs before first import attempt",
      "confidence": 0.62,
      "impact_if_wrong": "high",
      "needs_confirmation": true
    }
  ],
  "recommended_actions_top3": [
    {
      "recommendation_id": "rec_1",
      "text": "Run checkpoint timing A/B test",
      "confidence": 0.74,
      "tradeoffs": ["requires event schema change", "results take ~1 week"],
      "why_this_ref": "trace:why_rec_1"
    },
    {
      "recommendation_id": "rec_2",
      "text": "Instrument activation step with event metadata",
      "confidence": 0.70,
      "tradeoffs": ["adds analytics overhead"],
      "why_this_ref": "trace:why_rec_2"
    },
    {
      "recommendation_id": "rec_3",
      "text": "Scope one implementation slice for guided import",
      "confidence": 0.63,
      "tradeoffs": ["engineering time tradeoff vs experiments"],
      "why_this_ref": "trace:why_rec_3"
    }
  ],
  "decisions_needed_top3": [
    "Choose experiment success threshold",
    "Approve event schema change",
    "Prioritize guided import slice for next sprint"
  ],
  "memory_updates": {
    "semantic_refs": ["mem_sem_1", "mem_sem_2"],
    "strategic_refs": ["mem_str_7"],
    "conflicts_created": ["conf_3"]
  },
  "authority_update": {
    "domain_key": "onboarding",
    "previous_level": "suggest",
    "current_level": "recommend",
    "reason": "Calibration and acceptance rates exceeded thresholds over last 10 decisions"
  },
  "trace_refs": {
    "replay_timeline": "trace:run_111",
    "tool_invocations": "trace:tools_run_111"
  },
  "follow_on_handoff_ready": true
}
```

---

## 9. Scoring and Anti-Drift Guardrails

### 9.1 Pre-Review Run Score (during/at end of run)
Compute `run_score_pre` from four dimensions:
- Goal Alignment (0–1): percent of actions tied to current goals/work items
- Evidence Quality (0–1): source quality, triangulation, freshness
- Novelty (0–1): non-duplicate useful findings
- Decision Readiness (0–1): clarity + tradeoffs + confidence + explicit asks

`run_score_pre = 0.35*alignment + 0.25*evidence + 0.15*novelty + 0.25*decision_readiness`

### 9.2 Post-Review Outcome Score (morning feedback)
Compute `run_score_post` from outcomes:
- Usefulness rating normalized (1–5 → 0–1)
- Recommendation outcome score:
  - accepted = 1.0
  - modified = 0.7
  - deferred = 0.4
  - rejected = 0.0
- Trust penalty for flagged issues

Example:
`run_score_post = 0.6*usefulness + 0.4*avg_recommendation_outcome - trust_penalty`

### 9.3 Drift Guardrails (Hard)
- Abort if no goal links are provided.
- Abort if minimum evidence requirement cannot be met and mission requires it.
- Abort if >40% actions are low-value/repetitive.
- Downgrade confidence when evidence is single-source.
- Flag run when recommendations lack explicit tradeoffs.
- Penalize documentation-heavy output with low decision utility.
- Flag any recommendation without a “why this?” explainer.
- Flag any key claim not linked to evidence or labeled hypothesis.

---

## 10. Adaptive Authority Model

Authority levels:
- `suggest`: offers options with low-confidence framing.
- `recommend`: proposes a preferred path with explicit tradeoffs.
- `assert`: strongly advocates a path and flags alternatives as lower expected value.
- `autonomous_limited`: can execute pre-approved actions within strict guardrails.

### 10.1 Escalation thresholds (per domain)
Escalate only if all are true:
- `competence_score >= 0.75`
- `calibration_score >= 0.70`
- `evidence_count_30d >= 12`
- ≥ 3 consecutive non-degraded runs in that domain
- **Recommendation acceptance/adaptation rate ≥ 60% over trailing 10 recommendations**
- No high-severity trust flags in trailing 10 runs

Never escalate more than one level per 7-day window.

### 10.2 De-escalation triggers
- Two degraded runs in a 7-day window.
- **Recommendation rejection rate > 35% over trailing 10 recommendations**
- Material contradiction found in strategic memory for active domain guidance.
- Trust rating average < 3.5 over trailing 5 evaluations.

### 10.3 Policy gates
- `assert` and `autonomous_limited` require explicit run-level permission in `authority_policy`.
- Autonomous write actions are allowed only when `allow_autonomous_write_actions` is true **and** tool scopes permit it.
- Low-recency domains (no quality evidence in 30 days) forced back to `suggest`.

---

## 11. First 3 Workflows to Implement

### Workflow A: Exploratory Research Sprint
Input: product question + constraints.  
Output: evidence map, opportunity list, recommended next experiment.

Stages:
1. Clarify hypotheses
2. Gather and grade evidence (register evidence items)
3. Synthesize options and tradeoffs (artifact)
4. Propose next-step experiments (artifact)

### Workflow B: Decision Memo + Experiment Card
Input: problem statement + target user + success metric.  
Output: one short decision memo and one experiment card.

Stages:
1. Problem framing
2. User/jobs-to-be-done pass
3. Solution option generation
4. Scope shaping for one testable slice
5. Decision memo + experiment card synthesis (artifacts w/ evidence links)

### Workflow C: Concept Build Spike
Input: concept hypothesis + technical constraints.  
Output: one concrete build slice and a verification note.

Stages:
1. Define smallest viable slice to build tonight
2. Implement or scaffold the slice (via scoped writes, preferably PR; otherwise emit patch artifact)
3. Run quick verification checks
4. Return what works, what broke, and next iteration move (artifact + trace)

---

## 12. Suggested MVP Stack

- Backend: TypeScript + Node.js
- DB: Postgres + pgvector
- Queue/Jobs: BullMQ or Temporal
- Orchestration: explicit finite-state workflow engine
- Frontend: Next.js dashboard (mission setup + morning review + replay)
- LLM providers: start with ChatGPT/Codex, keep provider adapter for multi-model support
- Storage: object store (S3-compatible) for artifacts/trace blobs

---

## 13. Build Plan (4 Weeks)

### Week 1
- Implement core schema + new tables: artifacts, evidence, tool invocations, run evaluations.
- Build run contract validator (including tool scopes, provenance requirements).
- Implement manual trigger for a single mission.
- Implement Context Compiler + `HandoffEnvelope`.

### Week 2
- Build orchestrator stage machine.
- Add evidence registry + artifact store end-to-end.
- Generate first morning brief with evidence refs.
- Enforce coffee-mode output limits.
- Emit `RunReport` with artifact/evidence refs.

### Week 3
- Add scoring engine (pre + post).
- Implement feedback capture UI and persistence (run evaluations + recommendation outcomes).
- Implement expertise scoring updates from outcomes.
- Implement replay view (timeline from tool invocations).
- Implement Workflow A end-to-end with provenance.

### Week 4
- Implement Workflows B and C.
- Add scheduling heartbeat and budget enforcement.
- Tighten morning review UX and “why this?” explainers.
- Implement memory governance (approval for strategic diffs, conflict creation).
- Add work items board (minimal continuity layer).

---

## 14. MVP Exit Criteria

MVP is successful when:
- At least 10 nightly runs complete without manual intervention.
- Morning brief is rated useful on ≥ 70% of runs.
- ≥ 60% of recommendations are accepted or adapted by user.
- Drift alerts catch low-value runs before completion.
- Authority level changes are accepted by user review on ≥ 80% of transitions.
- ≤ 10% of runs violate coffee-mode limits.
- ≥ 90% of recommendations have a “why this?” explainer and evidence or hypothesis label.
- Replay view can reconstruct any run’s key actions and tool calls.

---

## 15. Open Decisions

- How aggressive should autonomy be by default (conservative vs proactive)?
- Should repo-write actions require explicit per-run approval (default yes)?
- What minimum evidence standard should be enforced per mission type?
- How many concurrent missions are allowed in MVP (likely 1)?
- Should authority be tracked per domain only, or per domain + workflow type?
- How long should episodic traces be retained before summarization/archival?

---

## 16. Seamless Handoff Rules

- Use `HandoffEnvelope` as the only input to night runs; do not pass full transcripts.
- Use `RunReport` as the default morning re-entry payload for chat.
- Keep memory and handoff state external to chat threads.
- Preserve stable IDs across modes: `project_id`, `thread_id`, `mission_id`, `handoff_id`.
- Require one-click user confirmation before each nightly run starts.
- On morning re-entry, inject only delta summary, decisions needed, assumptions, and memory refs.

---

## 17. Feedback and Outcomes

### 17.1 Why this exists
Adaptive authority and “getting better” require structured ground truth. Morning review is the canonical outcome signal.

### 17.2 Outcome capture rules (MVP)
- Every run must create:
  - a `run_evaluation` record initialized as `capture_status = pending`
  - recommendation outcome records initialized as `outcome = pending`
- If morning review is submitted, update those records to `submitted` with final values.
- If no review is provided by `due_at`, set `capture_status = timeout` and exclude that run from post-review score aggregation.
- If user flags an incorrect fact:
  - create a `memory_conflict` or mark semantic memory as contested
  - add a correction note linked to evidence

### 17.3 Mapping outcomes to expertise
- `competence_score`: increases when recommendations accepted/adapted and decisions answered successfully
- `calibration_score`: tracks alignment between confidence and outcome success
- `coverage_score`: based on breadth of evidence and successful decisions in domain over time

---

## 18. Traceability and Provenance

### 18.1 Trace guarantees (MVP)
For each run, store:
- plan versions (`plan_versions`)
- tool invocations (`tool_invocations`)
- artifacts and evidence links (`artifacts`, `evidence_items`, `artifact_evidence_links`)
- memory diffs (`memory_diffs`) and approvals if required

### 18.2 “Why this?” explainers
Each recommendation must link to:
- goal/work item linkage
- top evidence items supporting it (or explicit “hypothesis” label)
- tradeoffs considered
- confidence rationale (brief)

### 18.3 Replay view requirements
- Timeline view by stage and tool invocation
- Collapsible tool call details
- Memory diff display (before/after summary)
- Quick filters: “writes”, “errors”, “assumptions”, “evidence added”

---

## 19. Tool Permissions and Sandboxing

### 19.1 Tool capability descriptors
Each tool declares:
- `reads`: true/false
- `writes`: true/false
- `external_side_effect`: `none|low|high`
- `reversible`: true/false
- `requires_approval`: `never|pre_run_batch|always`
- `scope_constraints`: paths/domains/apis/limits

### 19.2 Approval gates
Default MVP posture:
- Reads are allowed within scope.
- Writes are **PR-only** (no direct main pushes).
- Unattended writes are allowed only with one-time pre-run batch approval and scoped path limits.
- Any external side-effects (email, deploy, payments) are denied in MVP.

### 19.3 Secret handling
- Secrets never enter model-visible context.
- Tools receive secrets via secure runtime injection.
- Trace store redacts secrets from tool invocation logs.

---

## 20. Memory Governance and Conflict Resolution

### 20.1 Write rules
- Episodic: always writable (append-only).
- Semantic:
  - must link to evidence OR be explicitly labeled as assumption/hypothesis
  - duplicates should be merged/superseded
- Strategic:
  - changes require explicit user approval OR be created as “proposed” with `approval_required`

### 20.2 Conflict rules
- Contradictions create `memory_conflicts` automatically.
- Conflicts must appear in the next morning brief (top 1–3, prioritized by impact).
- Resolution options:
  - choose one memory item as canonical
  - keep both with scoped applicability (e.g., “applies to SMB only”)
  - mark as unresolved but force `suggest` authority in that domain until resolved

### 20.3 Forgetting/archival (MVP)
- Episodic traces: retain raw for N days; then summarize and archive.
- Semantic memory: keep active unless superseded/contested.
- Strategic memory: never delete; only supersede with approval.

---

## 21. Assumptions and Branching

### 21.1 Assumption registry requirements
When the run proceeds without clarity:
- record assumption with confidence and impact
- include it in the morning brief
- if high impact, convert to explicit decision request unless branching resolves it cheaply

### 21.2 Branching policy (bounded)
- If `impact_if_wrong = high` and branch cost is low:
  - run up to 2 branches
  - report both outcomes, recommend the safer/default path
- If blocked and cannot branch:
  - create a decision item
  - redirect remaining budget to other goal-aligned work

---

## 22. Work Graph and Continuity

### 22.1 Work item lifecycle
Work items are updated by runs:
- status transitions (e.g., `in_progress` → `blocked`)
- next_step updates
- links to artifacts/evidence and decisions

### 22.2 Mission ↔ work item linkage rules
- Every mission should link to ≥ 1 work item **or** produce a new work item.
- Morning brief must name which work items advanced and what changed.
