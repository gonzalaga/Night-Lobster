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
  workItemIds: z.array(z.string()).default([]),
  status: z.nativeEnum(MissionStatus).default(MissionStatus.scheduled),
  scheduledFor: z.string().datetime().optional()
});

const linkWorkItemSchema = z.object({
  workItemId: z.string().min(1)
});

export async function registerMissionRoutes(app: FastifyInstance): Promise<void> {
  app.get("/missions", async (request) => {
    const query = z
      .object({ projectId: z.string().optional() })
      .safeParse(request.query);

    return prisma.mission.findMany({
      where: query.success && query.data.projectId ? { projectId: query.data.projectId } : undefined,
      include: {
        links: {
          include: {
            workItem: true
          }
        }
      },
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

    if (parsed.data.workItemIds.length > 0) {
      const validWorkItems = await prisma.workItem.findMany({
        where: {
          id: { in: parsed.data.workItemIds },
          projectId: parsed.data.projectId
        },
        select: { id: true }
      });

      if (validWorkItems.length > 0) {
        await prisma.missionWorkLink.createMany({
          data: validWorkItems.map((item) => ({
            missionId: mission.id,
            workItemId: item.id
          })),
          skipDuplicates: true
        });
      }
    }

    const withLinks = await prisma.mission.findUniqueOrThrow({
      where: { id: mission.id },
      include: {
        links: {
          include: {
            workItem: true
          }
        }
      }
    });

    return reply.status(201).send(withLinks);
  });

  app.get("/missions/:missionId/work-items", async (request, reply) => {
    const params = z.object({ missionId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const mission = await prisma.mission.findUnique({
      where: { id: params.data.missionId },
      include: {
        links: {
          include: {
            workItem: true
          }
        }
      }
    });

    if (!mission) {
      return reply.status(404).send({ error: "Mission not found" });
    }

    return mission.links.map((link) => link.workItem);
  });

  app.post("/missions/:missionId/work-items", async (request, reply) => {
    const params = z.object({ missionId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const parsed = linkWorkItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const [mission, workItem] = await Promise.all([
      prisma.mission.findUnique({ where: { id: params.data.missionId } }),
      prisma.workItem.findUnique({ where: { id: parsed.data.workItemId } })
    ]);

    if (!mission) {
      return reply.status(404).send({ error: "Mission not found" });
    }

    if (!workItem) {
      return reply.status(404).send({ error: "Work item not found" });
    }

    if (mission.projectId !== workItem.projectId) {
      return reply.status(400).send({ error: "Mission and work item must belong to the same project" });
    }

    const link = await prisma.missionWorkLink.upsert({
      where: {
        missionId_workItemId: {
          missionId: mission.id,
          workItemId: workItem.id
        }
      },
      update: {},
      create: {
        missionId: mission.id,
        workItemId: workItem.id
      }
    });

    return reply.status(201).send(link);
  });

  app.delete("/missions/:missionId/work-items/:workItemId", async (request, reply) => {
    const params = z
      .object({
        missionId: z.string().min(1),
        workItemId: z.string().min(1)
      })
      .safeParse(request.params);

    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const deleted = await prisma.missionWorkLink.deleteMany({
      where: {
        missionId: params.data.missionId,
        workItemId: params.data.workItemId
      }
    });

    return { ok: true, deletedCount: deleted.count };
  });
}
