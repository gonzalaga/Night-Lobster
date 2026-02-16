import { Queue } from "bullmq";
import { env } from "../config/env.js";

export const connection = { url: env.REDIS_URL };

export const NIGHT_RUN_QUEUE = "night-runs";

export type NightRunJob = {
  runId: string;
};

export const nightRunQueue = new Queue<NightRunJob, void, "night-run">(NIGHT_RUN_QUEUE, {
  connection,
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 100
  }
});
