import { Hono } from "hono";
import { ComfyGenerateRequestSchema, type ComfyGenerateResponse } from "@morpheflow/spec";
import { fetchComfyImage, generateImages, launchComfy } from "../services/comfy.ts";

export const comfyRoutes = new Hono()
  .post("/launch", async (c) => {
    await launchComfy();
    return c.json({ ok: true });
  })
  .post("/generate", async (c) => {
    const request = ComfyGenerateRequestSchema.parse(await c.req.json());
    return c.json<ComfyGenerateResponse>({ images: await generateImages(request) });
  })
  .get("/view", async (c) => {
    const query = new URL(c.req.url).search.slice(1);
    const upstream = await fetchComfyImage(query);
    return new Response(upstream.body, {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "image/png" },
    });
  });
