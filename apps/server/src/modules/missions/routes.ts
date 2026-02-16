import { FastifyInstance } from "fastify";
import { MissionStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/client.js";

const createMissionSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  objective: z.string().min(1),
  constraints: z.record(z.unknown()).default({}),
  successCriteria: z.array(z.string()).default([]),
  status: z.nativeEnum(MissionStatus).default(MissionStatus.scheduled),
  scheduledFor: z.string().datetime().optional()
});

export async function registerMissionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/missions", async (request) => {
    const query = z
      .object({ projectId: z.string().optional() })
      .safeParse(request.query);

    return prisma.mission.findMany({
      where: query.success && query.data.projectId ? { projectId: query.data.projectId } : undefined,
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/missions", async (request, reply) => {
    const parsed = createMissionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const mission = await prisma.mission.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        objective: parsed.data.objective,
        constraintsJson: parsed.data.constraints as Prisma.InputJsonValue,
        successCriteriaJson: parsed.data.successCriteria,
        status: parsed.data.status,
        scheduledFor: parsed.data.scheduledFor ? new Date(parsed.data.scheduledFor) : null
      }
    });

    return reply.status(201).send(mission);
  });
}
