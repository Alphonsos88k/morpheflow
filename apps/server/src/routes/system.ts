import { Hono } from "hono";
import { PickPathRequestSchema, type PickPathResponse, type SetupStatus } from "@morpheflow/spec";
import { readCustomBackground } from "../services/customBackground.ts";
import { pickPath } from "../services/pathPicker.ts";
import { checkSetup } from "../services/setupCheck.ts";

export const systemRoutes = new Hono()
  .get("/setup", async (c) => c.json<SetupStatus>(await checkSetup()))
  // "Check now": look up the newest Blender/ComfyUI versions regardless of the schedule.
  .post("/setup/check-updates", async (c) =>
    c.json<SetupStatus>(await checkSetup({ forceUpdateCheck: true })),
  )
  // The custom background image from Settings → General (images only).
  .get("/background", (c) => {
    const { body, type } = readCustomBackground();
    return c.body(new Uint8Array(body), 200, { "Content-Type": type, "Cache-Control": "no-cache" });
  })
  .post("/pick-path", async (c) => {
    const request = PickPathRequestSchema.parse(await c.req.json());
    return c.json<PickPathResponse>({ path: await pickPath(request) });
  });
