import { z } from "zod";

/**
 * Shapes of the JSON that system prompts ask the AI to return (system_prompts/*.md).
 * The server validates every reply against these and retries once on a bad reply.
 * Keep each in sync with the "Reply with JSON only" line of its prompt file.
 */

const Hex = z.string().regex(/^#[0-9a-fA-F]{3,8}$/);

/** clarify.md */
export const ClarifyOutputSchema = z.object({
  questions: z
    .array(z.object({ question: z.string(), options: z.array(z.string()).min(2).max(4) }))
    .min(1)
    .max(5),
  suggestions: z
    .array(z.object({ label: z.string(), change: z.string() }))
    .max(3)
    .default([]),
});
export type ClarifyOutput = z.infer<typeof ClarifyOutputSchema>;

/** enhance_prompt.md */
export const EnhanceOutputSchema = z.object({
  positive: z.string().min(1),
  negative: z.string(),
  scene: z.object({
    subject: z.string(),
    style: z.string(),
    environment: z.string(),
    lighting: z.string(),
    camera: z.string(),
    palette: z.array(Hex).default([]),
  }),
});
export type EnhanceOutput = z.infer<typeof EnhanceOutputSchema>;

/** vision_reading.md */
export const VisionReadingSchema = z.object({
  reading: z.string(),
  style_rules: z.array(z.string()).default([]),
  palette: z.array(Hex).default([]),
});
export type VisionReading = z.infer<typeof VisionReadingSchema>;

/** suggestions.md */
export const SuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.object({ label: z.string(), edit: z.string() }))
    .min(1)
    .max(5),
});
export type SuggestionsOutput = z.infer<typeof SuggestionsOutputSchema>;

/** comfy_suggestor.md */
export const ComfySuggestorOutputSchema = z.object({
  turn_on: z.array(z.string()).default([]),
  install: z.array(z.object({ name: z.string(), why: z.string(), url: z.string() })).default([]),
  warnings: z.array(z.string()).default([]),
});
export type ComfySuggestorOutput = z.infer<typeof ComfySuggestorOutputSchema>;
