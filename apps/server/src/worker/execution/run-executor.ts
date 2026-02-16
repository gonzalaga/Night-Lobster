import path from "node:path";
import {
  handoffEnvelopeSchema,
  nightlyRunContractSchema,
  runReportSchema,
  type HandoffEnvelope,
  type NightlyRunContract
} from "@nightlobster/contracts";
import { Prisma } from "@prisma/client";
import { prisma } from "../../db/client.js";
import { computePreReviewScore } from "../../services/scoring.js";
import {
  generateProviderPlan,
  generateProviderSynthesis,
  type ProviderMeta,
  type ProviderSynthesis
} from "../../services/provider-planner.js";
import { gatherRepoEvidence } from "./repo-tool.js";
import { gatherWebEvidence } from "./web-tool.js";
import { writeNightArtifacts, writeScopedDocumentation } from "./documentation-tool.js";

type Recommendation = {
  recommendationId: string;
  text: string;
  confidence: number;
  tradeoffs: string[];
  whyThisRef: string;
};

type Assumption = {
  statement: string;
  confidence: number;
  impact_if_wrong: "low" | "medium" | "high";
  needs_confirmation: boolean;
};

type ExecutionArtifacts = {
  artifactIds: string[];
  evidenceIds: string[];
  recommendations: Recommendation[];
  assumptions: Assumption[];
  decisions: string[];
  objectiveResult: string;
  deltaSummary: string[];
  provider: ProviderMeta;
};

async function recordStep(params: {
  runId: string;
  stage: "intake" | "plan" | "execute" | "synthesize" | "handoff";
  action: string;
  resultSummary: string;
  confidence: number;
}): Promise<void> {
  await prisma.runStep.create({
    data: {
      runId: params.runId,
      stage: params.stage,
      action: params.action,
      resultSummary: params.resultSummary,
      confidence: params.confidence
    }
  });
}

async function recordToolInvocation(params: {
  runId: string;
  toolName: string;
  requestJson: Record<string, unknown>;
  status: "ok" | "error" | "timeout" | "denied";
  responseRef?: string;
  errorText?: string;
  costEstimateJson?: Record<string, unknown>;
}): Promise<void> {
  await prisma.toolInvocation.create({
    data: {
      runId: params.runId,
      toolName: params.toolName,
      requestJson: params.requestJson as Prisma.InputJsonValue,
      status: params.status,
      responseRef: params.responseRef,
      errorText: params.errorText,
      costEstimateJson: params.costEstimateJson as Prisma.InputJsonValue | undefined,
      endedAt: new Date()
    }
  });
}

function buildFallbackDecisions(): string[] {
  return [
    "Choose experiment success threshold",
    "Approve documentation-backed patch scope",
    "Confirm next slice priority for tomorrow"
  ];
}

function mapRecommendations(runId: string, input: ProviderSynthesis["recommendations"]): Recommendation[] {
  return input.slice(0, 3).map((item, index) => ({
    recommendationId: `rec_${index + 1}`,
    text: item.text,
    confidence: item.confidence,
    tradeoffs: item.tradeoffs,
    whyThisRef: `trace://${runId}/why_rec_${index + 1}`
  }));
}

function normalizeProviderMeta(planMeta: ProviderMeta, synthesisMeta: ProviderMeta): ProviderMeta {
  const plannerSource = planMeta.planner_source;
  const synthesizerSource = synthesisMeta.synthesizer_source;

  return {
    mode: plannerSource === "openai" && synthesizerSource === "openai" ? "provider" : "fallback",
    planner_model: planMeta.planner_model,
    synthesizer_model: synthesisMeta.synthesizer_model,
    planner_source: plannerSource,
    synthesizer_source: synthesizerSource
  };
}

async function executeStages(params: {
  runId: string;
  projectId: string;
  objective: string;
  handoff: HandoffEnvelope;
  contract: NightlyRunContract;
  workspaceRoot: string;
}): Promise<ExecutionArtifacts> {
  await recordStep({
    runId: params.runId,
    stage: "intake",
    action: "Validated handoff envelope and run contract",
    resultSummary: "Constraints and authority policy parsed successfully",
    confidence: 0.82
  });

  await recordToolInvocation({
    runId: params.runId,
    toolName: "planner.validate_contract",
    requestJson: {
      handoff_id: params.handoff.handoff_id,
      mission_id: params.handoff.mission_id,
      max_runtime_minutes: params.contract.constraints.max_runtime_minutes
    },
    status: "ok",
    responseRef: `trace://${params.runId}/contract-validation`
  });

  const planResult = await generateProviderPlan({
    objective: params.objective,
    goalLinks: params.contract.goal_links,
    openQuestions: params.handoff.open_questions,
    successCriteria: params.contract.success_criteria
  });

  await recordToolInvocation({
    runId: params.runId,
    toolName: "provider.plan",
    requestJson: {
      objective: params.objective,
      goals: params.contract.goal_links,
      open_questions: params.handoff.open_questions,
      source: planResult.meta.planner_source,
      model: planResult.meta.planner_model
    },
    status: "ok",
    responseRef: `trace://${params.runId}/provider-plan`
  });

  await recordStep({
    runId: params.runId,
    stage: "plan",
    action: "Constructed bounded execution plan",
    resultSummary: planResult.data.plan_summary,
    confidence: 0.78
  });

  const minEvidence = Math.max(params.contract.provenance_requirements.min_evidence_items, 3);
  const repoEvidence = await gatherRepoEvidence(params.workspaceRoot, minEvidence);

  await recordToolInvocation({
    runId: params.runId,
    toolName: "repo.scan_workspace",
    requestJson: { max_items: minEvidence, selected: repoEvidence.length },
    status: "ok",
    responseRef: `trace://${params.runId}/repo-evidence`
  });

  const webInputs = [
    ...params.handoff.open_questions,
    ...params.handoff.must_use_context.map((item) => item.fact),
    ...params.handoff.must_use_context.map((item) => item.source_ref)
  ];

  const webEvidence = await gatherWebEvidence(webInputs, 2);

  await recordToolInvocation({
    runId: params.runId,
    toolName: "web.fetch_context_urls",
    requestJson: { candidate_inputs: webInputs.length, selected: webEvidence.length },
    status: "ok",
    responseRef: `trace://${params.runId}/web-evidence`
  });

  const mergedEvidence = [...repoEvidence, ...webEvidence].slice(0, minEvidence);

  const evidenceRows = await prisma.evidenceItem.createManyAndReturn({
    data: mergedEvidence.map((item) => ({
      runId: params.runId,
      projectId: params.projectId,
      kind: item.kind,
      citation: item.citation,
      qualityScore: item.qualityScore,
      excerpt: item.excerpt,
      notes: item.notes
    }))
  });

  const synthesisResult = await generateProviderSynthesis({
    objective: params.objective,
    goalLinks: params.contract.goal_links,
    planSummary: planResult.data.plan_summary,
    evidence: evidenceRows.map((row) => ({
      citation: row.citation,
      qualityScore: row.qualityScore ?? 0.5,
      excerpt: row.excerpt ?? ""
    }))
  });

  await recordToolInvocation({
    runId: params.runId,
    toolName: "provider.synthesize",
    requestJson: {
      objective: params.objective,
      evidence_count: evidenceRows.length,
      source: synthesisResult.meta.synthesizer_source,
      model: synthesisResult.meta.synthesizer_model
    },
    status: "ok",
    responseRef: `trace://${params.runId}/provider-synthesis`
  });

  const recommendations = mapRecommendations(params.runId, synthesisResult.data.recommendations);
  const assumptions =
    synthesisResult.data.assumptions.length > 0
      ? synthesisResult.data.assumptions
      : planResult.data.assumptions;

  const decisions = [
    ...synthesisResult.data.decisions.slice(0, 3),
    ...buildFallbackDecisions()
  ].slice(0, 3);

  const drafts = await writeNightArtifacts({
    workspaceRoot: params.workspaceRoot,
    runId: params.runId,
    objective: params.objective,
    evidenceRefs: evidenceRows.map((row) => row.id),
    recommendations,
    assumptions
  });

  await recordToolInvocation({
    runId: params.runId,
    toolName: "docs.generate_artifacts",
    requestJson: { artifact_count: drafts.length },
    status: "ok",
    responseRef: `trace://${params.runId}/artifacts`
  });

  const writeScope = params.contract.constraints.tool_policy.scopes.repo_write_pr?.allowed_paths ?? [];
  const writeResult = await writeScopedDocumentation({
    workspaceRoot: params.workspaceRoot,
    runId: params.runId,
    objective: params.objective,
    allowedPaths: writeScope
  });

  await recordToolInvocation({
    runId: params.runId,
    toolName: "repo.write_documentation",
    requestJson: {
      target: "apps/server/src/generated/nightly-run-<runId>.md",
      approval_mode: params.contract.constraints.tool_policy.scopes.repo_write_pr?.requires_approval ?? "never"
    },
    status: writeResult.written ? "ok" : "denied",
    responseRef: writeResult.filePath ?? undefined,
    errorText: writeResult.written ? undefined : writeResult.reason
  });

  const artifacts = await prisma.artifact.createManyAndReturn({
    data: drafts.map((item) => ({
      runId: params.runId,
      projectId: params.projectId,
      type: item.type,
      title: item.title,
      format: item.format,
      storageUri: path.relative(params.workspaceRoot, item.storagePath),
      summary: item.summary
    }))
  });

  await recordStep({
    runId: params.runId,
    stage: "execute",
    action: "Executed repository/web/documentation tool adapters",
    resultSummary: `Collected ${evidenceRows.length} evidence items and generated ${artifacts.length} artifacts`,
    confidence: 0.74
  });

  await prisma.decision.createMany({
    data: decisions.map((question) => ({
      projectId: params.projectId,
      runId: params.runId,
      question,
      status: "open"
    }))
  });

  await prisma.recommendationOutcome.createMany({
    data: recommendations.map((item) => ({
      runId: params.runId,
      recommendationId: item.recommendationId,
      outcome: "pending"
    }))
  });

  await recordStep({
    runId: params.runId,
    stage: "synthesize",
    action: "Built recommendations and decision queue",
    resultSummary: `Generated ${recommendations.length} recommendations with tradeoffs`,
    confidence: 0.72
  });

  return {
    artifactIds: artifacts.map((item) => item.id),
    evidenceIds: evidenceRows.map((item) => item.id),
    recommendations,
    assumptions,
    decisions,
    objectiveResult: synthesisResult.data.objective_result,
    deltaSummary: synthesisResult.data.delta_summary,
    provider: normalizeProviderMeta(planResult.meta, synthesisResult.meta)
  };
}

export async function executeNightRun(runId: string): Promise<void> {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      mission: true,
      handoff: true
    }
  });

  if (!run || !run.handoffId || !run.handoff) {
    throw new Error(`Run not found or missing handoff: ${runId}`);
  }

  const handoff = handoffEnvelopeSchema.parse(run.handoff.envelopeJson);
  const contract = nightlyRunContractSchema.parse(run.runContractJson);

  await prisma.run.update({
    where: { id: runId },
    data: { status: "running", startedAt: new Date() }
  });

  await prisma.mission.update({
    where: { id: run.missionId },
    data: { status: "running" }
  });

  const workspaceRoot = process.cwd();
  const artifacts = await executeStages({
    runId,
    projectId: run.projectId,
    objective: run.mission.objective,
    handoff,
    contract,
    workspaceRoot
  });

  await prisma.runEvaluation.create({
    data: {
      runId,
      projectId: run.projectId,
      captureStatus: "pending",
      dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  const alignment = contract.goal_links.length > 0 ? 0.82 : 0.25;
  const evidenceQuality = Math.min(1, 0.55 + artifacts.evidenceIds.length * 0.08);
  const novelty = artifacts.evidenceIds.length > 2 ? 0.68 : 0.52;
  const decisionReadiness = artifacts.decisions.length === 3 ? 0.78 : 0.5;

  const preReviewScore = computePreReviewScore({
    alignment,
    evidence: evidenceQuality,
    novelty,
    decisionReadiness
  });

  const report = runReportSchema.parse({
    report_id: `rep_${runId}`,
    run_id: runId,
    project_id: run.projectId,
    handoff_id: run.handoffId,
    mission_status: "completed",
    objective_result: artifacts.objectiveResult,
    delta_summary: artifacts.deltaSummary,
    evidence_refs: artifacts.evidenceIds,
    artifact_refs: artifacts.artifactIds,
    assumptions: artifacts.assumptions,
    recommended_actions_top3: artifacts.recommendations.map((item) => ({
      recommendation_id: item.recommendationId,
      text: item.text,
      confidence: item.confidence,
      tradeoffs: item.tradeoffs,
      why_this_ref: item.whyThisRef
    })),
    decisions_needed_top3: artifacts.decisions,
    memory_updates: {
      semantic_refs: [],
      strategic_refs: [],
      conflicts_created: []
    },
    authority_update: {
      domain_key: contract.domain_scope[0] ?? "default",
      previous_level: "suggest",
      current_level: contract.authority_policy.max_level_this_run,
      reason: "Run produced decision-grade evidence and bounded recommendations"
    },
    trace_refs: {
      replay_timeline: `trace://${runId}/timeline`,
      tool_invocations: `trace://${runId}/tools`
    },
    provider: artifacts.provider,
    follow_on_handoff_ready: true
  });

  await prisma.runReport.create({
    data: {
      runId,
      projectId: run.projectId,
      handoffId: run.handoffId,
      reportJson: report,
      summaryText: report.delta_summary.join(" ")
    }
  });

  await recordStep({
    runId,
    stage: "handoff",
    action: "Generated run report and morning handoff",
    resultSummary: "Coffee-mode report ready with evidence and recommendation refs",
    confidence: 0.74
  });

  await prisma.run.update({
    where: { id: runId },
    data: {
      status: "completed",
      endedAt: new Date(),
      scoreJson: {
        pre_review: {
          score: preReviewScore,
          alignment,
          evidence: evidenceQuality,
          novelty,
          decision_readiness: decisionReadiness
        }
      }
    }
  });

  await prisma.mission.update({
    where: { id: run.missionId },
    data: { status: "completed" }
  });

  await prisma.handoff.update({
    where: { id: run.handoffId },
    data: { status: "completed" }
  });
}
