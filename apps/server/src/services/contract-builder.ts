import {
  handoffEnvelopeSchema,
  nightlyRunContractSchema,
  type HandoffEnvelope,
  type NightlyRunContract
} from "@nightlobster/contracts";

export function buildRunContractFromHandoff(handoff: unknown): NightlyRunContract {
  const parsedHandoff = handoffEnvelopeSchema.parse(handoff);
  const contract = {
    project_id: parsedHandoff.project_id,
    mission_id: parsedHandoff.mission_id,
    objective: parsedHandoff.objective,
    domain_scope: ["default"],
    goal_links: parsedHandoff.goal_links,
    work_item_links: parsedHandoff.work_item_links,
    constraints: {
      max_runtime_minutes: parsedHandoff.constraints.max_runtime_minutes,
      max_tokens: 120000,
      tool_policy: parsedHandoff.constraints.tool_policy,
      forbidden_actions: parsedHandoff.constraints.forbidden_actions
    },
    success_criteria: parsedHandoff.success_criteria,
    stop_conditions: [
      "budget_exhausted",
      "confidence_stagnation",
      "insufficient_evidence",
      "permission_denied_repeated"
    ],
    provenance_requirements: {
      min_evidence_items: parsedHandoff.provenance_requirements.min_evidence_items,
      claims_must_link_evidence: parsedHandoff.provenance_requirements.claims_must_link_evidence,
      allow_hypotheses: true,
      hypotheses_must_be_labeled: true
    },
    assumption_policy: {
      max_open_assumptions: parsedHandoff.assumption_policy.max_open_assumptions,
      branch_if_impact_high_and_cost_low: true,
      when_blocked_convert_to_decision: parsedHandoff.assumption_policy.when_blocked_convert_to_decision
    },
    output_requirements: {
      morning_brief: true,
      decision_queue: true,
      artifacts: ["decision_memo", "experiment_card", "code_diff"] as const,
      artifact_limits: {
        max_artifacts: 3,
        max_words_per_artifact: 300
      },
      brief_style: "coffee_mode" as const,
      max_morning_read_minutes: 5
    },
    trace_requirements: {
      record_tool_invocations: true,
      record_plan_versions: true,
      record_memory_diffs: true,
      why_this_explainers: true
    },
    authority_policy: parsedHandoff.authority_policy,
    feedback_requirements: {
      collect_run_evaluation: true,
      collect_recommendation_outcomes: true
    }
  };

  return nightlyRunContractSchema.parse(contract);
}

export function parseHandoffEnvelope(input: unknown): HandoffEnvelope {
  return handoffEnvelopeSchema.parse(input);
}
