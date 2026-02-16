import { FastifyBaseLogger } from "fastify";
import { env } from "../config/env.js";
import { prisma } from "../db/client.js";
import { queueRunFromHandoff } from "./run-launcher.js";

const CHECK_INTERVAL_MS = 60 * 1000;

type StopFn = () => void;

function isWithinSchedulingWindow(now: Date): boolean {
  return (
    now.getHours() === env.NIGHTLY_RUN_HOUR_LOCAL &&
    now.getMinutes() < env.NIGHTLY_SCHEDULER_WINDOW_MINUTES
  );
}

export function startNightScheduler(log: FastifyBaseLogger): StopFn {
  let running = false;

  const tick = async (): Promise<void> => {
    if (running) {
      return;
    }

    const now = new Date();
    if (!isWithinSchedulingWindow(now)) {
      return;
    }

    running = true;
    try {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);

      const missions = await prisma.mission.findMany({
        where: {
          status: "scheduled",
          OR: [{ scheduledFor: null }, { scheduledFor: { lte: now } }]
        },
        include: {
          handoffs: {
            where: {
              targetMode: "night_run",
              status: { in: ["ready", "queued", "queued_by_scheduler"] }
            },
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      });

      for (const mission of missions) {
        const handoff = mission.handoffs[0];
        if (!handoff) {
          continue;
        }

        const existingToday = await prisma.run.findFirst({
          where: {
            missionId: mission.id,
            createdAt: { gte: todayStart },
            status: { in: ["queued", "running", "completed", "partial"] }
          }
        });

        if (existingToday) {
          continue;
        }

        const queued = await queueRunFromHandoff(handoff.id, {
          source: "scheduler",
          dedupeMinutes: 24 * 60
        });

        if (!queued.deduped) {
          log.info({ missionId: mission.id, runId: queued.runId }, "Queued mission from nightly scheduler");
        }
      }
    } catch (error) {
      log.error(error, "Night scheduler tick failed");
    } finally {
      running = false;
    }
  };

  const interval = setInterval(() => {
    void tick();
  }, CHECK_INTERVAL_MS);

  void tick();

  return () => {
    clearInterval(interval);
  };
}
