import { z } from "zod";
export declare const authorityLevelSchema: z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>;
export declare const recommendationOutcomeSchema: z.ZodEnum<["pending", "accepted", "modified", "rejected", "deferred"]>;
export declare const runEvaluationStatusSchema: z.ZodEnum<["pending", "submitted", "timeout"]>;
export declare const toolPolicySchema: z.ZodObject<{
    allowed_tools: z.ZodArray<z.ZodString, "many">;
    denied_tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    scopes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
        allowed_paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        allowed_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        max_files_changed: z.ZodOptional<z.ZodNumber>;
        max_diff_lines: z.ZodOptional<z.ZodNumber>;
        max_requests: z.ZodOptional<z.ZodNumber>;
        requires_approval: z.ZodOptional<z.ZodEnum<["never", "pre_run_batch", "always"]>>;
    }, "strip", z.ZodTypeAny, {
        allowed_paths?: string[] | undefined;
        allowed_domains?: string[] | undefined;
        max_files_changed?: number | undefined;
        max_diff_lines?: number | undefined;
        max_requests?: number | undefined;
        requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
    }, {
        allowed_paths?: string[] | undefined;
        allowed_domains?: string[] | undefined;
        max_files_changed?: number | undefined;
        max_diff_lines?: number | undefined;
        max_requests?: number | undefined;
        requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
    }>>>;
}, "strip", z.ZodTypeAny, {
    allowed_tools: string[];
    denied_tools: string[];
    scopes: Record<string, {
        allowed_paths?: string[] | undefined;
        allowed_domains?: string[] | undefined;
        max_files_changed?: number | undefined;
        max_diff_lines?: number | undefined;
        max_requests?: number | undefined;
        requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
    }>;
}, {
    allowed_tools: string[];
    denied_tools?: string[] | undefined;
    scopes?: Record<string, {
        allowed_paths?: string[] | undefined;
        allowed_domains?: string[] | undefined;
        max_files_changed?: number | undefined;
        max_diff_lines?: number | undefined;
        max_requests?: number | undefined;
        requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
    }> | undefined;
}>;
export declare const authorityPolicySchema: z.ZodObject<{
    start_level: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
    max_level_this_run: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
    allow_autonomous_write_actions: z.ZodDefault<z.ZodBoolean>;
    escalation_mode: z.ZodDefault<z.ZodEnum<["threshold_gated"]>>;
}, "strip", z.ZodTypeAny, {
    start_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
    max_level_this_run: "suggest" | "recommend" | "assert" | "autonomous_limited";
    allow_autonomous_write_actions: boolean;
    escalation_mode: "threshold_gated";
}, {
    start_level?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
    max_level_this_run?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
    allow_autonomous_write_actions?: boolean | undefined;
    escalation_mode?: "threshold_gated" | undefined;
}>;
export declare const nightlyRunContractSchema: z.ZodObject<{
    project_id: z.ZodString;
    mission_id: z.ZodString;
    objective: z.ZodString;
    domain_scope: z.ZodArray<z.ZodString, "many">;
    goal_links: z.ZodArray<z.ZodString, "many">;
    work_item_links: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    constraints: z.ZodObject<{
        max_runtime_minutes: z.ZodNumber;
        max_tokens: z.ZodNumber;
        tool_policy: z.ZodObject<{
            allowed_tools: z.ZodArray<z.ZodString, "many">;
            denied_tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            scopes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                allowed_paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                allowed_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                max_files_changed: z.ZodOptional<z.ZodNumber>;
                max_diff_lines: z.ZodOptional<z.ZodNumber>;
                max_requests: z.ZodOptional<z.ZodNumber>;
                requires_approval: z.ZodOptional<z.ZodEnum<["never", "pre_run_batch", "always"]>>;
            }, "strip", z.ZodTypeAny, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        }, {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        }>;
        forbidden_actions: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        max_runtime_minutes: number;
        max_tokens: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        };
        forbidden_actions: string[];
    }, {
        max_runtime_minutes: number;
        max_tokens: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        };
        forbidden_actions: string[];
    }>;
    success_criteria: z.ZodArray<z.ZodString, "many">;
    stop_conditions: z.ZodArray<z.ZodString, "many">;
    provenance_requirements: z.ZodObject<{
        min_evidence_items: z.ZodDefault<z.ZodNumber>;
        claims_must_link_evidence: z.ZodDefault<z.ZodBoolean>;
        allow_hypotheses: z.ZodDefault<z.ZodBoolean>;
        hypotheses_must_be_labeled: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        min_evidence_items: number;
        claims_must_link_evidence: boolean;
        allow_hypotheses: boolean;
        hypotheses_must_be_labeled: boolean;
    }, {
        min_evidence_items?: number | undefined;
        claims_must_link_evidence?: boolean | undefined;
        allow_hypotheses?: boolean | undefined;
        hypotheses_must_be_labeled?: boolean | undefined;
    }>;
    assumption_policy: z.ZodObject<{
        max_open_assumptions: z.ZodDefault<z.ZodNumber>;
        branch_if_impact_high_and_cost_low: z.ZodDefault<z.ZodBoolean>;
        when_blocked_convert_to_decision: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        max_open_assumptions: number;
        branch_if_impact_high_and_cost_low: boolean;
        when_blocked_convert_to_decision: boolean;
    }, {
        max_open_assumptions?: number | undefined;
        branch_if_impact_high_and_cost_low?: boolean | undefined;
        when_blocked_convert_to_decision?: boolean | undefined;
    }>;
    output_requirements: z.ZodObject<{
        morning_brief: z.ZodDefault<z.ZodBoolean>;
        decision_queue: z.ZodDefault<z.ZodBoolean>;
        artifacts: z.ZodDefault<z.ZodArray<z.ZodEnum<["decision_memo", "experiment_card", "code_diff"]>, "many">>;
        artifact_limits: z.ZodObject<{
            max_artifacts: z.ZodDefault<z.ZodNumber>;
            max_words_per_artifact: z.ZodDefault<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            max_artifacts: number;
            max_words_per_artifact: number;
        }, {
            max_artifacts?: number | undefined;
            max_words_per_artifact?: number | undefined;
        }>;
        brief_style: z.ZodDefault<z.ZodEnum<["coffee_mode"]>>;
        max_morning_read_minutes: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        morning_brief: boolean;
        decision_queue: boolean;
        artifacts: ("decision_memo" | "experiment_card" | "code_diff")[];
        artifact_limits: {
            max_artifacts: number;
            max_words_per_artifact: number;
        };
        brief_style: "coffee_mode";
        max_morning_read_minutes: number;
    }, {
        artifact_limits: {
            max_artifacts?: number | undefined;
            max_words_per_artifact?: number | undefined;
        };
        morning_brief?: boolean | undefined;
        decision_queue?: boolean | undefined;
        artifacts?: ("decision_memo" | "experiment_card" | "code_diff")[] | undefined;
        brief_style?: "coffee_mode" | undefined;
        max_morning_read_minutes?: number | undefined;
    }>;
    trace_requirements: z.ZodObject<{
        record_tool_invocations: z.ZodDefault<z.ZodBoolean>;
        record_plan_versions: z.ZodDefault<z.ZodBoolean>;
        record_memory_diffs: z.ZodDefault<z.ZodBoolean>;
        why_this_explainers: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        record_tool_invocations: boolean;
        record_plan_versions: boolean;
        record_memory_diffs: boolean;
        why_this_explainers: boolean;
    }, {
        record_tool_invocations?: boolean | undefined;
        record_plan_versions?: boolean | undefined;
        record_memory_diffs?: boolean | undefined;
        why_this_explainers?: boolean | undefined;
    }>;
    authority_policy: z.ZodObject<{
        start_level: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
        max_level_this_run: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
        allow_autonomous_write_actions: z.ZodDefault<z.ZodBoolean>;
        escalation_mode: z.ZodDefault<z.ZodEnum<["threshold_gated"]>>;
    }, "strip", z.ZodTypeAny, {
        start_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        max_level_this_run: "suggest" | "recommend" | "assert" | "autonomous_limited";
        allow_autonomous_write_actions: boolean;
        escalation_mode: "threshold_gated";
    }, {
        start_level?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        max_level_this_run?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        allow_autonomous_write_actions?: boolean | undefined;
        escalation_mode?: "threshold_gated" | undefined;
    }>;
    feedback_requirements: z.ZodObject<{
        collect_run_evaluation: z.ZodDefault<z.ZodBoolean>;
        collect_recommendation_outcomes: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        collect_run_evaluation: boolean;
        collect_recommendation_outcomes: boolean;
    }, {
        collect_run_evaluation?: boolean | undefined;
        collect_recommendation_outcomes?: boolean | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    constraints: {
        max_runtime_minutes: number;
        max_tokens: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        };
        forbidden_actions: string[];
    };
    objective: string;
    project_id: string;
    mission_id: string;
    domain_scope: string[];
    goal_links: string[];
    work_item_links: string[];
    success_criteria: string[];
    stop_conditions: string[];
    provenance_requirements: {
        min_evidence_items: number;
        claims_must_link_evidence: boolean;
        allow_hypotheses: boolean;
        hypotheses_must_be_labeled: boolean;
    };
    assumption_policy: {
        max_open_assumptions: number;
        branch_if_impact_high_and_cost_low: boolean;
        when_blocked_convert_to_decision: boolean;
    };
    output_requirements: {
        morning_brief: boolean;
        decision_queue: boolean;
        artifacts: ("decision_memo" | "experiment_card" | "code_diff")[];
        artifact_limits: {
            max_artifacts: number;
            max_words_per_artifact: number;
        };
        brief_style: "coffee_mode";
        max_morning_read_minutes: number;
    };
    trace_requirements: {
        record_tool_invocations: boolean;
        record_plan_versions: boolean;
        record_memory_diffs: boolean;
        why_this_explainers: boolean;
    };
    authority_policy: {
        start_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        max_level_this_run: "suggest" | "recommend" | "assert" | "autonomous_limited";
        allow_autonomous_write_actions: boolean;
        escalation_mode: "threshold_gated";
    };
    feedback_requirements: {
        collect_run_evaluation: boolean;
        collect_recommendation_outcomes: boolean;
    };
}, {
    constraints: {
        max_runtime_minutes: number;
        max_tokens: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        };
        forbidden_actions: string[];
    };
    objective: string;
    project_id: string;
    mission_id: string;
    domain_scope: string[];
    goal_links: string[];
    success_criteria: string[];
    stop_conditions: string[];
    provenance_requirements: {
        min_evidence_items?: number | undefined;
        claims_must_link_evidence?: boolean | undefined;
        allow_hypotheses?: boolean | undefined;
        hypotheses_must_be_labeled?: boolean | undefined;
    };
    assumption_policy: {
        max_open_assumptions?: number | undefined;
        branch_if_impact_high_and_cost_low?: boolean | undefined;
        when_blocked_convert_to_decision?: boolean | undefined;
    };
    output_requirements: {
        artifact_limits: {
            max_artifacts?: number | undefined;
            max_words_per_artifact?: number | undefined;
        };
        morning_brief?: boolean | undefined;
        decision_queue?: boolean | undefined;
        artifacts?: ("decision_memo" | "experiment_card" | "code_diff")[] | undefined;
        brief_style?: "coffee_mode" | undefined;
        max_morning_read_minutes?: number | undefined;
    };
    trace_requirements: {
        record_tool_invocations?: boolean | undefined;
        record_plan_versions?: boolean | undefined;
        record_memory_diffs?: boolean | undefined;
        why_this_explainers?: boolean | undefined;
    };
    authority_policy: {
        start_level?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        max_level_this_run?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        allow_autonomous_write_actions?: boolean | undefined;
        escalation_mode?: "threshold_gated" | undefined;
    };
    feedback_requirements: {
        collect_run_evaluation?: boolean | undefined;
        collect_recommendation_outcomes?: boolean | undefined;
    };
    work_item_links?: string[] | undefined;
}>;
export declare const handoffEnvelopeSchema: z.ZodObject<{
    handoff_id: z.ZodString;
    project_id: z.ZodString;
    thread_id: z.ZodString;
    mission_id: z.ZodString;
    source_provider: z.ZodEnum<["chatgpt", "codex", "other"]>;
    target_mode: z.ZodEnum<["night_run", "chat"]>;
    objective: z.ZodString;
    goal_links: z.ZodArray<z.ZodString, "many">;
    work_item_links: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    decisions_already_made: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    open_questions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    must_use_context: z.ZodDefault<z.ZodArray<z.ZodObject<{
        fact: z.ZodString;
        source_ref: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        fact: string;
        source_ref: string;
    }, {
        fact: string;
        source_ref: string;
    }>, "many">>;
    constraints: z.ZodObject<{
        max_runtime_minutes: z.ZodNumber;
        tool_policy: z.ZodObject<{
            allowed_tools: z.ZodArray<z.ZodString, "many">;
            denied_tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            scopes: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodObject<{
                allowed_paths: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                allowed_domains: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                max_files_changed: z.ZodOptional<z.ZodNumber>;
                max_diff_lines: z.ZodOptional<z.ZodNumber>;
                max_requests: z.ZodOptional<z.ZodNumber>;
                requires_approval: z.ZodOptional<z.ZodEnum<["never", "pre_run_batch", "always"]>>;
            }, "strip", z.ZodTypeAny, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>>>;
        }, "strip", z.ZodTypeAny, {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        }, {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        }>;
        forbidden_actions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        max_runtime_minutes: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        };
        forbidden_actions: string[];
    }, {
        max_runtime_minutes: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        };
        forbidden_actions?: string[] | undefined;
    }>;
    provenance_requirements: z.ZodObject<{
        min_evidence_items: z.ZodDefault<z.ZodNumber>;
        claims_must_link_evidence: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        min_evidence_items: number;
        claims_must_link_evidence: boolean;
    }, {
        min_evidence_items?: number | undefined;
        claims_must_link_evidence?: boolean | undefined;
    }>;
    assumption_policy: z.ZodObject<{
        max_open_assumptions: z.ZodDefault<z.ZodNumber>;
        when_blocked_convert_to_decision: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        max_open_assumptions: number;
        when_blocked_convert_to_decision: boolean;
    }, {
        max_open_assumptions?: number | undefined;
        when_blocked_convert_to_decision?: boolean | undefined;
    }>;
    success_criteria: z.ZodArray<z.ZodString, "many">;
    authority_policy: z.ZodObject<{
        start_level: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
        max_level_this_run: z.ZodDefault<z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>>;
        allow_autonomous_write_actions: z.ZodDefault<z.ZodBoolean>;
        escalation_mode: z.ZodDefault<z.ZodEnum<["threshold_gated"]>>;
    }, "strip", z.ZodTypeAny, {
        start_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        max_level_this_run: "suggest" | "recommend" | "assert" | "autonomous_limited";
        allow_autonomous_write_actions: boolean;
        escalation_mode: "threshold_gated";
    }, {
        start_level?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        max_level_this_run?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        allow_autonomous_write_actions?: boolean | undefined;
        escalation_mode?: "threshold_gated" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    constraints: {
        max_runtime_minutes: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools: string[];
            scopes: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }>;
        };
        forbidden_actions: string[];
    };
    objective: string;
    project_id: string;
    mission_id: string;
    goal_links: string[];
    work_item_links: string[];
    success_criteria: string[];
    provenance_requirements: {
        min_evidence_items: number;
        claims_must_link_evidence: boolean;
    };
    assumption_policy: {
        max_open_assumptions: number;
        when_blocked_convert_to_decision: boolean;
    };
    authority_policy: {
        start_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        max_level_this_run: "suggest" | "recommend" | "assert" | "autonomous_limited";
        allow_autonomous_write_actions: boolean;
        escalation_mode: "threshold_gated";
    };
    handoff_id: string;
    thread_id: string;
    source_provider: "chatgpt" | "codex" | "other";
    target_mode: "night_run" | "chat";
    decisions_already_made: string[];
    open_questions: string[];
    must_use_context: {
        fact: string;
        source_ref: string;
    }[];
}, {
    constraints: {
        max_runtime_minutes: number;
        tool_policy: {
            allowed_tools: string[];
            denied_tools?: string[] | undefined;
            scopes?: Record<string, {
                allowed_paths?: string[] | undefined;
                allowed_domains?: string[] | undefined;
                max_files_changed?: number | undefined;
                max_diff_lines?: number | undefined;
                max_requests?: number | undefined;
                requires_approval?: "never" | "pre_run_batch" | "always" | undefined;
            }> | undefined;
        };
        forbidden_actions?: string[] | undefined;
    };
    objective: string;
    project_id: string;
    mission_id: string;
    goal_links: string[];
    success_criteria: string[];
    provenance_requirements: {
        min_evidence_items?: number | undefined;
        claims_must_link_evidence?: boolean | undefined;
    };
    assumption_policy: {
        max_open_assumptions?: number | undefined;
        when_blocked_convert_to_decision?: boolean | undefined;
    };
    authority_policy: {
        start_level?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        max_level_this_run?: "suggest" | "recommend" | "assert" | "autonomous_limited" | undefined;
        allow_autonomous_write_actions?: boolean | undefined;
        escalation_mode?: "threshold_gated" | undefined;
    };
    handoff_id: string;
    thread_id: string;
    source_provider: "chatgpt" | "codex" | "other";
    target_mode: "night_run" | "chat";
    work_item_links?: string[] | undefined;
    decisions_already_made?: string[] | undefined;
    open_questions?: string[] | undefined;
    must_use_context?: {
        fact: string;
        source_ref: string;
    }[] | undefined;
}>;
export declare const runReportSchema: z.ZodObject<{
    report_id: z.ZodString;
    run_id: z.ZodString;
    project_id: z.ZodString;
    handoff_id: z.ZodString;
    mission_status: z.ZodEnum<["completed", "partial", "failed"]>;
    objective_result: z.ZodString;
    delta_summary: z.ZodArray<z.ZodString, "many">;
    evidence_refs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    artifact_refs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    assumptions: z.ZodArray<z.ZodObject<{
        statement: z.ZodString;
        confidence: z.ZodNumber;
        impact_if_wrong: z.ZodEnum<["low", "medium", "high"]>;
        needs_confirmation: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        statement: string;
        confidence: number;
        impact_if_wrong: "low" | "medium" | "high";
        needs_confirmation: boolean;
    }, {
        statement: string;
        confidence: number;
        impact_if_wrong: "low" | "medium" | "high";
        needs_confirmation?: boolean | undefined;
    }>, "many">;
    recommended_actions_top3: z.ZodArray<z.ZodObject<{
        recommendation_id: z.ZodString;
        text: z.ZodString;
        confidence: z.ZodNumber;
        tradeoffs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        why_this_ref: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        confidence: number;
        recommendation_id: string;
        text: string;
        tradeoffs: string[];
        why_this_ref: string;
    }, {
        confidence: number;
        recommendation_id: string;
        text: string;
        why_this_ref: string;
        tradeoffs?: string[] | undefined;
    }>, "many">;
    decisions_needed_top3: z.ZodArray<z.ZodString, "many">;
    memory_updates: z.ZodObject<{
        semantic_refs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        strategic_refs: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        conflicts_created: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        semantic_refs: string[];
        strategic_refs: string[];
        conflicts_created: string[];
    }, {
        semantic_refs?: string[] | undefined;
        strategic_refs?: string[] | undefined;
        conflicts_created?: string[] | undefined;
    }>;
    authority_update: z.ZodObject<{
        domain_key: z.ZodString;
        previous_level: z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>;
        current_level: z.ZodEnum<["suggest", "recommend", "assert", "autonomous_limited"]>;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        domain_key: string;
        previous_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        current_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        reason: string;
    }, {
        domain_key: string;
        previous_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        current_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        reason: string;
    }>;
    trace_refs: z.ZodObject<{
        replay_timeline: z.ZodString;
        tool_invocations: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        replay_timeline: string;
        tool_invocations: string;
    }, {
        replay_timeline: string;
        tool_invocations: string;
    }>;
    follow_on_handoff_ready: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    project_id: string;
    handoff_id: string;
    report_id: string;
    run_id: string;
    mission_status: "completed" | "failed" | "partial";
    objective_result: string;
    delta_summary: string[];
    evidence_refs: string[];
    artifact_refs: string[];
    assumptions: {
        statement: string;
        confidence: number;
        impact_if_wrong: "low" | "medium" | "high";
        needs_confirmation: boolean;
    }[];
    recommended_actions_top3: {
        confidence: number;
        recommendation_id: string;
        text: string;
        tradeoffs: string[];
        why_this_ref: string;
    }[];
    decisions_needed_top3: string[];
    memory_updates: {
        semantic_refs: string[];
        strategic_refs: string[];
        conflicts_created: string[];
    };
    authority_update: {
        domain_key: string;
        previous_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        current_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        reason: string;
    };
    trace_refs: {
        replay_timeline: string;
        tool_invocations: string;
    };
    follow_on_handoff_ready: boolean;
}, {
    project_id: string;
    handoff_id: string;
    report_id: string;
    run_id: string;
    mission_status: "completed" | "failed" | "partial";
    objective_result: string;
    delta_summary: string[];
    assumptions: {
        statement: string;
        confidence: number;
        impact_if_wrong: "low" | "medium" | "high";
        needs_confirmation?: boolean | undefined;
    }[];
    recommended_actions_top3: {
        confidence: number;
        recommendation_id: string;
        text: string;
        why_this_ref: string;
        tradeoffs?: string[] | undefined;
    }[];
    decisions_needed_top3: string[];
    memory_updates: {
        semantic_refs?: string[] | undefined;
        strategic_refs?: string[] | undefined;
        conflicts_created?: string[] | undefined;
    };
    authority_update: {
        domain_key: string;
        previous_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        current_level: "suggest" | "recommend" | "assert" | "autonomous_limited";
        reason: string;
    };
    trace_refs: {
        replay_timeline: string;
        tool_invocations: string;
    };
    evidence_refs?: string[] | undefined;
    artifact_refs?: string[] | undefined;
    follow_on_handoff_ready?: boolean | undefined;
}>;
export type NightlyRunContract = z.infer<typeof nightlyRunContractSchema>;
export type HandoffEnvelope = z.infer<typeof handoffEnvelopeSchema>;
export type RunReport = z.infer<typeof runReportSchema>;
