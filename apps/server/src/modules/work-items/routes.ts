import { FastifyInstance } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../../db/client.js";

const createWorkItemSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1),
  type: z.string().min(1),
  status: z.enum(["backlog", "in_progress", "blocked", "done"]).default("backlog"),
  priority: z.number().int().min(1).max(5).default(3),
  goalLinks: z.array(z.string()).default([]),
  links: z.array(z.string()).default([]),
  nextStep: z.string().optional(),
  owner: z.enum(["agent", "human"]).default("agent")
});

const updateWorkItemSchema = z
  .object({
    title: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    status: z.enum(["backlog", "in_progress", "blocked", "done"]).optional(),
    priority: z.number().int().min(1).max(5).optional(),
    goalLinks: z.array(z.string()).optional(),
    links: z.array(z.string()).optional(),
    nextStep: z.string().nullable().optional(),
    owner: z.enum(["agent", "human"]).optional()
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one field is required"
  });

const linkMissionSchema = z.object({
  missionId: z.string().min(1)
});

export async function registerWorkItemRoutes(app: FastifyInstance): Promise<void> {
  app.get("/work-items", async (request, reply) => {
    const query = z
      .object({
        projectId: z.string().optional(),
        status: z.enum(["backlog", "in_progress", "blocked", "done"]).optional(),
        owner: z.enum(["agent", "human"]).optional()
      })
      .safeParse(request.query);

    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() });
    }

    return prisma.workItem.findMany({
      where: {
        projectId: query.data.projectId,
        status: query.data.status,
        owner: query.data.owner
      },
      include: {
        missions: {
          include: {
            mission: {
              select: { id: true, title: true, status: true, scheduledFor: true }
            }
          }
        }
      },
      orderBy: [{ priority: "asc" }, { updatedAt: "desc" }]
    });
  });

  app.get("/work-items/:workItemId", async (request, reply) => {
    const params = z.object({ workItemId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const item = await prisma.workItem.findUnique({
      where: { id: params.data.workItemId },
      include: {
        missions: {
          include: {
            mission: {
              select: { id: true, title: true, status: true, scheduledFor: true }
            }
          }
        }
      }
    });

    if (!item) {
      return reply.status(404).send({ error: "Work item not found" });
    }

    return item;
  });

  app.post("/work-items", async (request, reply) => {
    const parsed = createWorkItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const workItem = await prisma.workItem.create({
      data: {
        projectId: parsed.data.projectId,
        title: parsed.data.title,
        type: parsed.data.type,
        status: parsed.data.status,
        priority: parsed.data.priority,
        goalLinksJson: parsed.data.goalLinks as Prisma.InputJsonValue,
        linksJson: parsed.data.links as Prisma.InputJsonValue,
        nextStep: parsed.data.nextStep,
        owner: parsed.data.owner
      }
    });

    return reply.status(201).send(workItem);
  });

  app.patch("/work-items/:workItemId", async (request, reply) => {
    const params = z.object({ workItemId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const parsed = updateWorkItemSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const updateData: Prisma.WorkItemUpdateInput = {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.type !== undefined ? { type: parsed.data.type } : {}),
      ...(parsed.data.status !== undefined ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority !== undefined ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.goalLinks !== undefined
        ? { goalLinksJson: parsed.data.goalLinks as Prisma.InputJsonValue }
        : {}),
      ...(parsed.data.links !== undefined ? { linksJson: parsed.data.links as Prisma.InputJsonValue } : {}),
      ...(parsed.data.nextStep !== undefined ? { nextStep: parsed.data.nextStep } : {}),
      ...(parsed.data.owner !== undefined ? { owner: parsed.data.owner } : {})
    };

    try {
      const workItem = await prisma.workItem.update({
        where: { id: params.data.workItemId },
        data: updateData
      });

      return workItem;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return reply.status(404).send({ error: "Work item not found" });
      }

      throw error;
    }
  });

  app.post("/work-items/:workItemId/link-mission", async (request, reply) => {
    const params = z.object({ workItemId: z.string().min(1) }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: params.error.flatten() });
    }

    const parsed = linkMissionSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const [workItem, mission] = await Promise.all([
      prisma.workItem.findUnique({ where: { id: params.data.workItemId } }),
      prisma.mission.findUnique({ where: { id: parsed.data.missionId } })
    ]);

    if (!workItem) {
      return reply.status(404).send({ error: "Work item not found" });
    }

    if (!mission) {
      return reply.status(404).send({ error: "Mission not found" });
    }

    if (workItem.projectId !== mission.projectId) {
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

  app.delete("/work-items/:workItemId/link-mission/:missionId", async (request) => {
    const params = z
      .object({
        workItemId: z.string().min(1),
        missionId: z.string().min(1)
      })
      .parse(request.params);

    const deleted = await prisma.missionWorkLink.deleteMany({
      where: {
        missionId: params.missionId,
        workItemId: params.workItemId
      }
    });

    return { ok: true, deletedCount: deleted.count };
  });
}
