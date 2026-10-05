import { Hono } from "hono";
import type { SettingsPatch } from "@morpheflow/spec";
import { getSettings, toPublicSettings, updateSettings } from "../services/settingsStore.ts";

export const settingsRoutes = new Hono()
  .get("/", (c) => c.json(toPublicSettings(getSettings())))
  // Full validation happens in updateSettings after merging the patch.
  .put("/", async (c) =>
    c.json(toPublicSettings(updateSettings(await c.req.json<SettingsPatch>()))),
  );
