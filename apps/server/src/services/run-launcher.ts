import { RunStatus } from "@prisma/client";
import { env } from "../config/env.js";
import { prisma } from "../db/client.js";
import { buildRunContractFromHandoff } from "./contract-builder.js";
import { nightRunQueue } from "../worker/queues.js";

type QueueRunOptions = {
  source: "api" | "scheduler";
  dedupeMinutes?: number;
};

export type QueueRunResult = {
  runId: string;
  deduped: boolean;
};

const activeStatuses: RunStatus[] = ["queued", "running", "completed", "partial"];

export async function queueRunFromHandoff(handoffId: string, options: QueueRunOptions): Promise<QueueRunResult> {
  const handoff = await prisma.handoff.findUnique({ where: { id: handoffId } });
  if (!handoff) {
    throw new Error(`Handoff not found: ${handoffId}`);
  }

  if (options.dedupeMinutes && options.dedupeMinutes > 0) {
    const since = new Date(Date.now() - options.dedupeMinutes * 60 * 1000);
    const existing = await prisma.run.findFirst({
      where: {
        handoffId,
        createdAt: { gte: since },
        status: { in: activeStatuses }
      },
      orderBy: { createdAt: "desc" }
    });

    if (existing) {
      return { runId: existing.id, deduped: true };
    }
  }

  const runContract = buildRunContractFromHandoff(handoff.envelopeJson);

  const run = await prisma.run.create({
    data: {
      projectId: handoff.projectId,
      missionId: handoff.missionId,
      handoffId: handoff.id,
      status: "queued",
      timeBudgetSec: env.NIGHTLY_RUN_MAX_RUNTIME_MINUTES * 60,
      tokenBudget: runContract.constraints.max_tokens,
      runContractJson: runContract
    }
  });

  await prisma.mission.update({
    where: { id: handoff.missionId },
    data: { status: "queued" }
  });

  await prisma.handoff.update({
    where: { id: handoff.id },
    data: {
      status: options.source === "scheduler" ? "queued_by_scheduler" : "queued"
    }
  });

  await nightRunQueue.add("night-run", { runId: run.id }, { jobId: `night-run-${run.id}` });
  return { runId: run.id, deduped: false };
}
