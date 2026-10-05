import { z } from "zod";

/**
 * Scene Spec v0: the shared "save file" every step reads and writes (designs.md §3.3).
 * Stage 1 only needs the prompt; later stages add fields here.
 */
export const SceneSpecSchema = z.object({
  version: z.literal(0),
  id: z.string(),
  prompt: z.string(),
  subject: z.string().optional(),
  style: z.object({ label: z.string(), rules: z.array(z.string()) }).optional(),
  comfy: z.object({ positive: z.string(), negative: z.string() }).optional(),
});
export type SceneSpec = z.infer<typeof SceneSpecSchema>;

/**
 * Creates an empty Scene Spec for a new session.
 * @param prompt - The user's raw idea.
 */
export function createSceneSpec(prompt: string): SceneSpec {
  return { version: 0, id: crypto.randomUUID(), prompt };
}
