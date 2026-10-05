import { Hono } from "hono";
import { listSessions, loadSession, saveSession } from "../services/sessions.ts";

export const sessionRoutes = new Hono()
  .get("/", (c) => c.json(listSessions()))
  .get("/:id", (c) => c.json(loadSession(c.req.param("id"))))
  .put("/:id", async (c) => c.json(saveSession(await c.req.json())));
