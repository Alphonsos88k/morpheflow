import { Hono } from "hono";
import { BlenderRunRequestSchema, type BlenderToolsResponse } from "@morpheflow/spec";
import { launchBlender } from "../services/blender.ts";
import { runBlenderAgent } from "../services/blenderAgent.ts";
import { listBlenderTools } from "../services/blenderMcp.ts";

export const blenderRoutes = new Hono()
  .post("/launch", async (c) => {
    await launchBlender();
    return c.json({ ok: true });
  })
  .get("/tools", async (c) => c.json<BlenderToolsResponse>({ tools: await listBlenderTools() }))
  .post("/run", async (c) => {
    const { prompt, sessionId } = BlenderRunRequestSchema.parse(await c.req.json());
    return c.json(await runBlenderAgent(prompt, sessionId));
  });
