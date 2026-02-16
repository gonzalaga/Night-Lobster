export type PreReviewScoreInput = {
  alignment: number;
  evidence: number;
  novelty: number;
  decisionReadiness: number;
};

export type PostReviewScoreInput = {
  usefulness: number;
  recommendationOutcomeAverage: number;
  trustPenalty: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function computePreReviewScore(input: PreReviewScoreInput): number {
  return clamp01(
    0.35 * input.alignment +
      0.25 * input.evidence +
      0.15 * input.novelty +
      0.25 * input.decisionReadiness
  );
}

export function computePostReviewScore(input: PostReviewScoreInput): number {
  return clamp01(0.6 * input.usefulness + 0.4 * input.recommendationOutcomeAverage - input.trustPenalty);
}
