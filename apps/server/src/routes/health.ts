import { Hono } from "hono";
import type { HealthResponse } from "@morpheflow/spec";
import { blenderStatus } from "../services/blender.ts";
import { comfyStatus } from "../services/comfy.ts";
import { activeModel, llmStatus } from "../services/llm.ts";
import { getRefreshStatus } from "../services/modelCatalog.ts";

export const healthRoutes = new Hono().get("/", async (c) => {
  const [comfy, blender] = await Promise.all([comfyStatus(), blenderStatus()]);
  return c.json<HealthResponse>({
    comfy,
    blender,
    llm: llmStatus(),
    llmModel: activeModel(),
    models: getRefreshStatus(),
  });
});
