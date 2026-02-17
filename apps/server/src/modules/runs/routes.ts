import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";
import { queueRunFromHandoff } from "../../services/run-launcher.js";

const createFromHandoffSchema = z.object({
  handoffId: z.string().min(1)
});

export async function registerRunRoutes(app: FastifyInstance): Promise<void> {
  app.get("/runs", async (request) => {
    const projectId = (request.query as { projectId?: string }).projectId;

    return prisma.run.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" }
    });
  });

  app.get("/runs/:runId", async (request, reply) => {
    const params = request.params as { runId: string };
    const run = await prisma.run.findUnique({
      where: { id: params.runId },
      include: {
        mission: true,
        reports: { orderBy: { createdAt: "desc" }, take: 1 },
        evaluations: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!run) {
      return reply.status(404).send({ error: "Run not found" });
    }

    return run;
  });

  app.get("/runs/:runId/replay", async (request, reply) => {
    const params = request.params as { runId: string };

    const run = await prisma.run.findUnique({
      where: { id: params.runId },
      include: {
        mission: true,
        handoff: true,
        steps: { orderBy: { timestamp: "asc" } },
        toolInvocations: { orderBy: { startedAt: "asc" } },
        artifacts: { orderBy: { createdAt: "asc" } },
        evidenceItems: { orderBy: { retrievedAt: "asc" } },
        reports: { orderBy: { createdAt: "desc" }, take: 1 }
      }
    });

    if (!run) {
      return reply.status(404).send({ error: "Run not found" });
    }

    const claimLinks = await prisma.artifactEvidenceLink.findMany({
      where: {
        artifact: {
          runId: params.runId
        }
      },
      include: {
        artifact: true,
        evidence: true
      },
      orderBy: { createdAt: "asc" }
    });

    const timeline = [
      ...run.steps.map((step) => ({
        ts: step.timestamp,
        type: "stage",
        label: step.stage,
        detail: step.action
      })),
      ...run.toolInvocations.map((invocation) => ({
        ts: invocation.startedAt,
        type: "tool",
        label: invocation.toolName,
        detail: invocation.status
      }))
    ].sort((a, b) => a.ts.getTime() - b.ts.getTime());

    return {
      run: {
        id: run.id,
        status: run.status,
        startedAt: run.startedAt,
        endedAt: run.endedAt
      },
      mission: run.mission,
      handoff: run.handoff,
      report: run.reports[0] ?? null,
      steps: run.steps,
      toolInvocations: run.toolInvocations,
      artifacts: run.artifacts,
      evidenceItems: run.evidenceItems,
      claimLinks,
      timeline
    };
  });

  app.post("/runs/from-handoff", async (request, reply) => {
    const parsed = createFromHandoffSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const queued = await queueRunFromHandoff(parsed.data.handoffId, {
        source: "api",
        dedupeMinutes: 60
      });
      return reply.status(201).send(queued);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Handoff not found")) {
        return reply.status(404).send({ error: "Handoff not found" });
      }

      throw error;
    }
  });
}
