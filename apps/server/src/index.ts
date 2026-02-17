import Fastify from "fastify";
import cors from "@fastify/cors";
import { env } from "./config/env.js";
import { registerProjectRoutes } from "./modules/projects/routes.js";
import { registerMissionRoutes } from "./modules/missions/routes.js";
import { registerHandoffRoutes } from "./modules/handoffs/routes.js";
import { registerRunRoutes } from "./modules/runs/routes.js";
import { registerMorningRoutes } from "./modules/morning/routes.js";
import { nextRunAt } from "./services/schedule.js";
import { startNightScheduler } from "./services/night-scheduler.js";

const app = Fastify({
  logger: {
    transport:
      process.env.NODE_ENV === "production"
        ? undefined
        : {
            target: "pino-pretty",
            options: { colorize: true }
          }
  }
});

await app.register(cors, {
  origin: true
});

app.get("/health", async () => ({
  ok: true,
  service: "night-lobster-server"
}));

app.get("/config/defaults", async () => ({
  nightly_run_hour_local: env.NIGHTLY_RUN_HOUR_LOCAL,
  nightly_runtime_minutes: env.NIGHTLY_RUN_MAX_RUNTIME_MINUTES,
  scheduler_window_minutes: env.NIGHTLY_SCHEDULER_WINDOW_MINUTES,
  write_policy: "read_write_with_documentation",
  provider: {
    model: env.OPENAI_MODEL,
    enabled: Boolean(env.OPENAI_API_KEY)
  },
  next_run_at_local: nextRunAt(env.NIGHTLY_RUN_HOUR_LOCAL).toISOString()
}));

await registerProjectRoutes(app);
await registerMissionRoutes(app);
await registerHandoffRoutes(app);
await registerRunRoutes(app);
await registerMorningRoutes(app);

const stopScheduler = startNightScheduler(app.log);
app.addHook("onClose", async () => {
  stopScheduler();
});

app.setErrorHandler((error, _request, reply) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  app.log.error(error);
  reply.status(500).send({
    error: "Internal server error",
    message
  });
});

const address = await app.listen({ port: env.PORT, host: "0.0.0.0" });
app.log.info(`Night Lobster server listening on ${address}`);
