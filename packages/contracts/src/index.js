import { z } from "zod";
export const authorityLevelSchema = z.enum([
    "suggest",
    "recommend",
    "assert",
    "autonomous_limited"
]);
export const recommendationOutcomeSchema = z.enum([
    "pending",
    "accepted",
    "modified",
    "rejected",
    "deferred"
]);
export const runEvaluationStatusSchema = z.enum([
    "pending",
    "submitted",
    "timeout"
]);
const toolScopeSchema = z.object({
    allowed_paths: z.array(z.string()).optional(),
    allowed_domains: z.array(z.string()).optional(),
    max_files_changed: z.number().int().positive().optional(),
    max_diff_lines: z.number().int().positive().optional(),
    max_requests: z.number().int().positive().optional(),
    requires_approval: z.enum(["never", "pre_run_batch", "always"]).optional()
});
export const toolPolicySchema = z.object({
    allowed_tools: z.array(z.string()).min(1),
    denied_tools: z.array(z.string()).default([]),
    scopes: z.record(toolScopeSchema).default({})
});
export const authorityPolicySchema = z.object({
    start_level: authorityLevelSchema.default("suggest"),
    max_level_this_run: authorityLevelSchema.default("recommend"),
    allow_autonomous_write_actions: z.boolean().default(true),
    escalation_mode: z.enum(["threshold_gated"]).default("threshold_gated")
});
export const nightlyRunContractSchema = z.object({
    project_id: z.string().min(1),
    mission_id: z.string().min(1),
    objective: z.string().min(1),
    domain_scope: z.array(z.string()).min(1),
    goal_links: z.array(z.string()).min(1),
    work_item_links: z.array(z.string()).default([]),
    constraints: z.object({
        max_runtime_minutes: z.number().int().positive().max(240),
        max_tokens: z.number().int().positive().max(1_000_000),
        tool_policy: toolPolicySchema,
        forbidden_actions: z.array(z.string()).min(1)
    }),
    success_criteria: z.array(z.string()).min(1),
    stop_conditions: z.array(z.string()).min(1),
    provenance_requirements: z.object({
        min_evidence_items: z.number().int().min(0).default(3),
        claims_must_link_evidence: z.boolean().default(true),
        allow_hypotheses: z.boolean().default(true),
        hypotheses_must_be_labeled: z.boolean().default(true)
    }),
    assumption_policy: z.object({
        max_open_assumptions: z.number().int().min(0).max(10).default(3),
        branch_if_impact_high_and_cost_low: z.boolean().default(true),
        when_blocked_convert_to_decision: z.boolean().default(true)
    }),
    output_requirements: z.object({
        morning_brief: z.boolean().default(true),
        decision_queue: z.boolean().default(true),
        artifacts: z.array(z.enum(["decision_memo", "experiment_card", "code_diff"]))
            .default(["decision_memo", "experiment_card", "code_diff"]),
        artifact_limits: z.object({
            max_artifacts: z.number().int().positive().max(10).default(3),
            max_words_per_artifact: z.number().int().positive().max(1000).default(300)
        }),
        brief_style: z.enum(["coffee_mode"]).default("coffee_mode"),
        max_morning_read_minutes: z.number().int().positive().max(15).default(5)
    }),
    trace_requirements: z.object({
        record_tool_invocations: z.boolean().default(true),
        record_plan_versions: z.boolean().default(true),
        record_memory_diffs: z.boolean().default(true),
        why_this_explainers: z.boolean().default(true)
    }),
    authority_policy: authorityPolicySchema,
    feedback_requirements: z.object({
        collect_run_evaluation: z.boolean().default(true),
        collect_recommendation_outcomes: z.boolean().default(true)
    })
});
export const handoffEnvelopeSchema = z.object({
    handoff_id: z.string().min(1),
    project_id: z.string().min(1),
    thread_id: z.string().min(1),
    mission_id: z.string().min(1),
    source_provider: z.enum(["chatgpt", "codex", "other"]),
    target_mode: z.enum(["night_run", "chat"]),
    objective: z.string().min(1),
    goal_links: z.array(z.string()).min(1),
    work_item_links: z.array(z.string()).default([]),
    decisions_already_made: z.array(z.string()).default([]),
    open_questions: z.array(z.string()).default([]),
    must_use_context: z.array(z.object({
        fact: z.string().min(1),
        source_ref: z.string().min(1)
    })).default([]),
    constraints: z.object({
        max_runtime_minutes: z.number().int().positive().max(240),
        tool_policy: toolPolicySchema,
        forbidden_actions: z.array(z.string()).default([])
    }),
    provenance_requirements: z.object({
        min_evidence_items: z.number().int().min(0).default(3),
        claims_must_link_evidence: z.boolean().default(true)
    }),
    assumption_policy: z.object({
        max_open_assumptions: z.number().int().min(0).max(10).default(3),
        when_blocked_convert_to_decision: z.boolean().default(true)
    }),
    success_criteria: z.array(z.string()).min(1),
    authority_policy: authorityPolicySchema
});
export const runReportSchema = z.object({
    report_id: z.string().min(1),
    run_id: z.string().min(1),
    project_id: z.string().min(1),
    handoff_id: z.string().min(1),
    mission_status: z.enum(["completed", "partial", "failed"]),
    objective_result: z.string().min(1),
    delta_summary: z.array(z.string()).max(5),
    evidence_refs: z.array(z.string()).default([]),
    artifact_refs: z.array(z.string()).default([]),
    assumptions: z.array(z.object({
        statement: z.string().min(1),
        confidence: z.number().min(0).max(1),
        impact_if_wrong: z.enum(["low", "medium", "high"]),
        needs_confirmation: z.boolean().default(true)
    })).max(3),
    recommended_actions_top3: z.array(z.object({
        recommendation_id: z.string().min(1),
        text: z.string().min(1),
        confidence: z.number().min(0).max(1),
        tradeoffs: z.array(z.string()).default([]),
        why_this_ref: z.string().min(1)
    })).max(3),
    decisions_needed_top3: z.array(z.string()).max(3),
    memory_updates: z.object({
        semantic_refs: z.array(z.string()).default([]),
        strategic_refs: z.array(z.string()).default([]),
        conflicts_created: z.array(z.string()).default([])
    }),
    authority_update: z.object({
        domain_key: z.string().min(1),
        previous_level: authorityLevelSchema,
        current_level: authorityLevelSchema,
        reason: z.string().min(1)
    }),
    trace_refs: z.object({
        replay_timeline: z.string().min(1),
        tool_invocations: z.string().min(1)
    }),
    follow_on_handoff_ready: z.boolean().default(true)
});
//# sourceMappingURL=index.js.map