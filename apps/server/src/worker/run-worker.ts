import { Worker } from "bullmq";
import { prisma } from "../db/client.js";
import { NIGHT_RUN_QUEUE, type NightRunJob, connection } from "./queues.js";
import { executeNightRun } from "./execution/run-executor.js";

const worker = new Worker<NightRunJob, void, "night-run">(
  NIGHT_RUN_QUEUE,
  async (job) => {
    await executeNightRun(job.data.runId);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`[worker] completed ${job.id}`);
});

worker.on("failed", async (job, err) => {
  if (!job) {
    return;
  }

  console.error(`[worker] failed ${job.id}`, err);
  await prisma.run.updateMany({
    where: { id: job.data.runId },
    data: {
      status: "failed",
      endedAt: new Date(),
      scoreJson: {
        pre_review: null,
        error: err.message
      }
    }
  });

  const run = await prisma.run.findUnique({ where: { id: job.data.runId } });
  if (run) {
    await prisma.mission.updateMany({
      where: { id: run.missionId, status: { in: ["running", "queued"] } },
      data: { status: "failed" }
    });
  }
});

const shutdown = async () => {
  await worker.close();
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log("Night Lobster worker listening for jobs");
