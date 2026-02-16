import { AuthorityLevel } from "@prisma/client";

export type AuthorityInputs = {
  competenceScore: number;
  calibrationScore: number;
  evidenceCount30d: number;
  recommendationAcceptanceRate: number;
  trustFlagHighSeverityCount: number;
  consecutiveNonDegradedRuns: number;
};

const order: AuthorityLevel[] = ["suggest", "recommend", "assert", "autonomous_limited"];

export function proposeAuthorityLevel(current: AuthorityLevel, input: AuthorityInputs): AuthorityLevel {
  const escalate =
    input.competenceScore >= 0.75 &&
    input.calibrationScore >= 0.7 &&
    input.evidenceCount30d >= 12 &&
    input.recommendationAcceptanceRate >= 0.6 &&
    input.trustFlagHighSeverityCount === 0 &&
    input.consecutiveNonDegradedRuns >= 3;

  if (!escalate) {
    return current;
  }

  const idx = order.indexOf(current);
  return order[Math.min(idx + 1, order.length - 1)];
}
