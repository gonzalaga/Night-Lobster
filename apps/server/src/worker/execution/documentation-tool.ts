import { promises as fs } from "node:fs";
import path from "node:path";

type Recommendation = {
  recommendationId: string;
  text: string;
  confidence: number;
  tradeoffs: string[];
};

type Assumption = {
  statement: string;
  confidence: number;
  impact_if_wrong: "low" | "medium" | "high";
  needs_confirmation: boolean;
};

type ArtifactDraft = {
  type: "decision_memo" | "experiment_card" | "code_diff";
  title: string;
  format: "md" | "patch";
  storagePath: string;
  summary: string;
};

function resolveFilePath(root: string, runId: string, fileName: string): string {
  return path.join(root, "artifacts", runId, fileName);
}

async function writeText(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

export async function writeNightArtifacts(params: {
  workspaceRoot: string;
  runId: string;
  objective: string;
  evidenceRefs: string[];
  recommendations: Recommendation[];
  assumptions: Assumption[];
}): Promise<ArtifactDraft[]> {
  const memoPath = resolveFilePath(params.workspaceRoot, params.runId, "decision_memo.md");
  const experimentPath = resolveFilePath(params.workspaceRoot, params.runId, "experiment_card.md");
  const patchPath = resolveFilePath(params.workspaceRoot, params.runId, "code_diff.patch");

  const memo = [
    `# Decision Memo`,
    "",
    `## Objective`,
    params.objective,
    "",
    `## Evidence`,
    ...params.evidenceRefs.map((item) => `- ${item}`),
    "",
    `## Recommended Actions`,
    ...params.recommendations.map(
      (item) => `- ${item.recommendationId}: ${item.text} (confidence ${item.confidence.toFixed(2)})`
    )
  ].join("\n");

  const experiment = [
    `# Experiment Card`,
    "",
    `## Hypothesis`,
    params.assumptions[0]?.statement ?? "Primary assumption requires validation",
    "",
    `## Steps`,
    `1. Implement scoped instrumentation`,
    `2. Run test for one week`,
    `3. Compare activation and dropoff delta`,
    "",
    `## Success Metric`,
    `- Improvement in activation completion rate`
  ].join("\n");

  const patch = [
    "*** Begin Patch",
    "*** Add File: apps/server/src/generated/nightly-experiment-note.md",
    "+# Nightly Experiment Note",
    `+Run: ${params.runId}`,
    "+",
    `+Objective: ${params.objective}`,
    "+",
    "+This file is generated as part of read/write with documentation policy.",
    "*** End Patch",
    ""
  ].join("\n");

  await Promise.all([
    writeText(memoPath, memo),
    writeText(experimentPath, experiment),
    writeText(patchPath, patch)
  ]);

  return [
    {
      type: "decision_memo",
      title: "Nightly decision memo",
      format: "md",
      storagePath: memoPath,
      summary: "Objective, evidence, and ranked recommendation summary"
    },
    {
      type: "experiment_card",
      title: "Nightly experiment card",
      format: "md",
      storagePath: experimentPath,
      summary: "One bounded experiment plan for next iteration"
    },
    {
      type: "code_diff",
      title: "Scoped patch draft",
      format: "patch",
      storagePath: patchPath,
      summary: "Patch artifact generated for write-with-documentation mode"
    }
  ];
}

function normalizePath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

function isAllowedByPatterns(relativePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }

  const normalizedTarget = normalizePath(relativePath);

  return patterns.some((pattern) => {
    const normalizedPattern = normalizePath(pattern);

    if (normalizedPattern === "*" || normalizedPattern === "**") {
      return true;
    }

    if (normalizedPattern.endsWith("/**")) {
      return normalizedTarget.startsWith(normalizedPattern.slice(0, -3));
    }

    return normalizedTarget === normalizedPattern;
  });
}

export async function writeScopedDocumentation(params: {
  workspaceRoot: string;
  runId: string;
  objective: string;
  allowedPaths: string[];
}): Promise<{ written: boolean; filePath: string | null; reason?: string }> {
  const relativePath = `apps/server/src/generated/nightly-run-${params.runId}.md`;
  if (!isAllowedByPatterns(relativePath, params.allowedPaths)) {
    return { written: false, filePath: null, reason: "write_path_out_of_scope" };
  }

  const absolute = path.join(params.workspaceRoot, relativePath);
  const content = [
    `# Nightly Run Documentation`,
    "",
    `Run: ${params.runId}`,
    `Objective: ${params.objective}`,
    "",
    `Generated automatically under read/write with documentation policy.`
  ].join("\n");

  await writeText(absolute, content);
  return { written: true, filePath: absolute };
}
