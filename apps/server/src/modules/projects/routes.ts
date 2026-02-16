import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../../db/client.js";

const createProjectSchema = z.object({
  name: z.string().min(1),
  purpose: z.string().min(1)
});

export async function registerProjectRoutes(app: FastifyInstance): Promise<void> {
  app.get("/projects", async () => {
    return prisma.project.findMany({
      orderBy: { createdAt: "desc" }
    });
  });

  app.post("/projects", async (request, reply) => {
    const parsed = createProjectSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const project = await prisma.project.create({
      data: {
        name: parsed.data.name,
        purpose: parsed.data.purpose
      }
    });

    return reply.status(201).send(project);
  });
}
