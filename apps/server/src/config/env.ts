import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  NIGHTLY_RUN_HOUR_LOCAL: z.coerce.number().int().min(0).max(23).default(21),
  NIGHTLY_RUN_MAX_RUNTIME_MINUTES: z.coerce.number().int().positive().max(240).default(120),
  NIGHTLY_SCHEDULER_WINDOW_MINUTES: z.coerce.number().int().min(1).max(60).default(10)
});

export const env = envSchema.parse(process.env);
