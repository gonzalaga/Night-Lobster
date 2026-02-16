import { promises as fs } from "node:fs";
import path from "node:path";

type RepoEvidence = {
  kind: "repo";
  citation: string;
  qualityScore: number;
  excerpt: string;
  notes: string;
};

const candidateFiles = [
  "README.md",
  "MVP_SPEC.md",
  "Night_Lobster_MVP_SPEC_REVISED.md",
  "apps/server/src/index.ts",
  "apps/server/src/modules/runs/routes.ts",
  "apps/web/app/missions/page.tsx",
  "apps/web/app/morning/page.tsx"
];

async function tryReadFile(filePath: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw;
  } catch {
    return null;
  }
}

export async function gatherRepoEvidence(workspaceRoot: string, maxItems: number): Promise<RepoEvidence[]> {
  const evidence: RepoEvidence[] = [];

  for (const relPath of candidateFiles) {
    if (evidence.length >= maxItems) {
      break;
    }

    const absolute = path.join(workspaceRoot, relPath);
    const content = await tryReadFile(absolute);
    if (!content) {
      continue;
    }

    const excerpt = content.replace(/\s+/g, " ").slice(0, 220);
    const qualityScore = relPath.endsWith(".md") ? 0.72 : 0.82;

    evidence.push({
      kind: "repo",
      citation: `repo:${relPath}`,
      qualityScore,
      excerpt,
      notes: "Repository source reviewed for implementation context"
    });
  }

  return evidence;
}
