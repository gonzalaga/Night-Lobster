import { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { prisma } from "../../db/client.js";
import { parseHandoffEnvelope } from "../../services/contract-builder.js";

export async function registerHandoffRoutes(app: FastifyInstance): Promise<void> {
  app.get("/handoffs", async (request) => {
    const projectId = (request.query as { projectId?: string }).projectId;

    return prisma.handoff.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/handoffs", async (request, reply) => {
    let parsed;
    try {
      parsed = parseHandoffEnvelope(request.body);
    } catch (error) {
      if (error instanceof ZodError) {
        return reply.status(400).send({ error: error.flatten() });
      }

      throw error;
    }

    const handoff = await prisma.handoff.create({
      data: {
        id: parsed.handoff_id,
        projectId: parsed.project_id,
        threadId: parsed.thread_id,
        missionId: parsed.mission_id,
        sourceProvider: parsed.source_provider,
        targetMode: parsed.target_mode,
        envelopeJson: parsed,
        status: "ready"
      }
    });

    return reply.status(201).send(handoff);
  });
}
