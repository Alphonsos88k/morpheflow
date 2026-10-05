import { Hono } from "hono";
import { ProviderSchema } from "@morpheflow/spec";
import { testProvider } from "../services/llm.ts";
import { getModelCatalog, refreshModelCatalog } from "../services/modelCatalog.ts";

export const llmRoutes = new Hono()
  .post("/test/:provider", async (c) => {
    const provider = ProviderSchema.parse(c.req.param("provider"));
    return c.json(await testProvider(provider));
  })
  .get("/models", (c) => c.json(getModelCatalog()))
  .post("/models/refresh", async (c) => c.json(await refreshModelCatalog()));
