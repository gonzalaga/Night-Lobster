import { FastifyInstance } from "fastify";
import { RecommendationOutcomeStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { computePostReviewScore } from "../../services/scoring.js";

const evaluationSchema = z.object({
  usefulnessRating: z.number().int().min(1).max(5),
  brevityRating: z.number().int().min(1).max(5),
  trustRating: z.number().int().min(1).max(5),
  notes: z.string().optional(),
  flaggedIssueTypes: z.array(z.string()).default([]),
  outcomes: z
    .array(
      z.object({
        recommendationId: z.string().min(1),
        outcome: z.nativeEnum(RecommendationOutcomeStatus),
        reason: z.string().optional()
      })
    )
    .default([])
});

function outcomeToScore(outcome: RecommendationOutcomeStatus): number {
  switch (outcome) {
    case "accepted":
      return 1;
    case "modified":
      return 0.7;
    case "deferred":
      return 0.4;
    case "rejected":
      return 0;
    case "pending":
      return 0.2;
  }
}

export async function registerMorningRoutes(app: FastifyInstance): Promise<void> {
  app.get("/morning/:runId", async (request, reply) => {
    const params = request.params as { runId: string };

    const run = await prisma.run.findUnique({
      where: { id: params.runId },
      include: {
        mission: true,
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
        recommendationOutcomes: true,
        decisions: true,
        artifacts: true,
        evidenceItems: true
      }
    });

    if (!run) {
      return reply.status(404).send({ error: "Run not found" });
    }

    return run;
  });

  app.post("/morning/:runId/evaluation", async (request, reply) => {
    const params = request.params as { runId: string };
    const parsed = evaluationSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const existingEval = await prisma.runEvaluation.findFirst({
      where: { runId: params.runId },
      orderBy: { createdAt: "desc" }
    });

    const recommendationOutcomes = parsed.data.outcomes;
    const avgOutcome =
      recommendationOutcomes.length === 0
        ? 0
        : recommendationOutcomes.reduce((acc, item) => acc + outcomeToScore(item.outcome), 0) /
          recommendationOutcomes.length;

    const trustPenalty = parsed.data.flaggedIssueTypes.length > 0 ? 0.15 : 0;
    const postScore = computePostReviewScore({
      usefulness: (parsed.data.usefulnessRating - 1) / 4,
      recommendationOutcomeAverage: avgOutcome,
      trustPenalty
    });

    if (existingEval) {
      await prisma.runEvaluation.update({
        where: { id: existingEval.id },
        data: {
          captureStatus: "submitted",
          usefulnessRating: parsed.data.usefulnessRating,
          brevityRating: parsed.data.brevityRating,
          trustRating: parsed.data.trustRating,
          notes: parsed.data.notes,
          flaggedIssueTypesJson: parsed.data.flaggedIssueTypes
        }
      });
    } else {
      const runRow = await prisma.run.findUniqueOrThrow({ where: { id: params.runId } });
      await prisma.runEvaluation.create({
        data: {
          runId: params.runId,
          projectId: runRow.projectId,
          captureStatus: "submitted",
          usefulnessRating: parsed.data.usefulnessRating,
          brevityRating: parsed.data.brevityRating,
          trustRating: parsed.data.trustRating,
          notes: parsed.data.notes,
          flaggedIssueTypesJson: parsed.data.flaggedIssueTypes
        }
      });
    }

    await Promise.all(
      recommendationOutcomes.map((item) =>
        prisma.recommendationOutcome.upsert({
          where: {
            id: `${params.runId}:${item.recommendationId}`
          },
          update: {
            outcome: item.outcome,
            reason: item.reason
          },
          create: {
            id: `${params.runId}:${item.recommendationId}`,
            runId: params.runId,
            recommendationId: item.recommendationId,
            outcome: item.outcome,
            reason: item.reason
          }
        })
      )
    );

    const currentRun = await prisma.run.findUniqueOrThrow({ where: { id: params.runId } });
    const existingScore = (currentRun.scoreJson as Record<string, unknown> | null) ?? {};

    const run = await prisma.run.update({
      where: { id: params.runId },
      data: {
        scoreJson: {
          ...existingScore,
          post_review: {
            score: postScore,
            usefulness: parsed.data.usefulnessRating,
            brevity: parsed.data.brevityRating,
            trust: parsed.data.trustRating
          }
        }
      }
    });

    return reply.send({ ok: true, runId: run.id, postScore });
  });
}
