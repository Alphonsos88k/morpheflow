import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { ZodError } from "zod";
import type { ApiError } from "@morpheflow/spec";
import { AppError, errorMessage } from "./lib/errors.ts";
import { log } from "./lib/logger.ts";
import { blenderRoutes } from "./routes/blender.ts";
import { comfyRoutes } from "./routes/comfy.ts";
import { healthRoutes } from "./routes/health.ts";
import { llmRoutes } from "./routes/llm.ts";
import { sessionRoutes } from "./routes/sessions.ts";
import { settingsRoutes } from "./routes/settings.ts";
import { systemRoutes } from "./routes/system.ts";
import { refreshModelCatalog } from "./services/modelCatalog.ts";
import { getSettings } from "./services/settingsStore.ts";

/** Polled every few seconds; logging them would flood the log. */
const QUIET_PATHS = new Set(["/api/health"]);

const app = new Hono()
  .basePath("/api")
  .use(async (c, next) => {
    const started = Date.now();
    await next();
    if (!QUIET_PATHS.has(c.req.path))
      log.info(`${c.req.method} ${c.req.path} → ${c.res.status} (${Date.now() - started} ms)`);
  })
  .route("/settings", settingsRoutes)
  .route("/health", healthRoutes)
  .route("/llm", llmRoutes)
  .route("/comfy", comfyRoutes)
  .route("/blender", blenderRoutes)
  .route("/sessions", sessionRoutes)
  .route("/system", systemRoutes);

// Every failure reaches the browser as { error: "readable message" }; unexpected ones are logged with a stack.
app.onError((err, c) => {
  if (err instanceof AppError) {
    log.warn(`${c.req.method} ${c.req.path}: ${err.message}`);
    return c.json<ApiError>({ error: err.message }, err.status);
  }
  if (err instanceof ZodError)
    return c.json<ApiError>({ error: err.issues.map((i) => i.message).join("; ") }, 400);
  log.error(`${c.req.method} ${c.req.path} failed`, err);
  return c.json<ApiError>({ error: errorMessage(err) }, 500);
});

process.on("unhandledRejection", (reason) => log.error("Unhandled promise rejection", reason));

const port = getSettings().app.serverPort;
// Local only: never reachable from other machines.
serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, () => {
  log.info(`morpheFlow server on http://127.0.0.1:${port}`);
  // Refresh model lists once per launch in the background (free: no AI tokens).
  void refreshModelCatalog().then(({ status }) => {
    log.info(
      `Model lists refreshed: ${JSON.stringify(status.counts)}; skipped (no key): ${status.skipped.join(", ") || "none"}`,
    );
    if (status.errors.length) log.warn(`Model list errors: ${status.errors.join("; ")}`);
  });
});
