import { z } from "zod";
import { LLM_TASKS, PROVIDERS } from "../constants/providers.ts";
import { STEP_DEFS, STEP_IDS, STEP_STATUSES, type StepId } from "../constants/steps.ts";
import { SceneSpecSchema, createSceneSpec } from "./sceneSpec.ts";

const UsageEntrySchema = z.object({
  at: z.string(),
  task: z.enum([...LLM_TASKS, "test"]),
  provider: z.enum(PROVIDERS),
  model: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cost: z.number().nullable(),
});

const StepStateSchema = z.object({ enabled: z.boolean(), status: z.enum(STEP_STATUSES) });

/**
 * Everything about one session, saved to `outputs/<id>/session.json` (designs.md §5.2).
 * Scene Spec is the shared data; `results` holds what steps produced.
 */
export const SessionSchema = z.object({
  version: z.literal(1),
  id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  scene: SceneSpecSchema,
  steps: z.record(z.enum(STEP_IDS), StepStateSchema),
  currentStep: z.enum(STEP_IDS),
  /** Furthest step index visited so far; "Next" can only go up to here. Older sessions default to 0. */
  maxReachedStep: z.number().int().min(0).default(0),
  results: z.object({
    comfyImages: z.array(z.string()),
    buildSteps: z.array(z.object({ tool: z.string(), summary: z.string() })),
    buildText: z.string(),
    /** `.blend` backups saved before each AI run (newest last). */
    blendVersions: z.array(z.string()),
  }),
  usage: z.array(UsageEntrySchema),
});
export type Session = z.infer<typeof SessionSchema>;

/** Short info for session lists. */
export interface SessionSummary {
  id: string;
  prompt: string;
  updatedAt: string;
}

/**
 * A fresh session with default step toggles.
 * @param prompt - Starting idea; may be empty.
 */
export function createSession(prompt = ""): Session {
  const now = new Date().toISOString();
  const scene = createSceneSpec(prompt);
  const steps = Object.fromEntries(
    STEP_DEFS.map((s) => [s.id, { enabled: s.defaultOn, status: "idle" as const }]),
  ) as Session["steps"];
  return {
    version: 1,
    id: scene.id,
    createdAt: now,
    updatedAt: now,
    scene,
    steps,
    currentStep: "prompt" satisfies StepId,
    maxReachedStep: 0,
    results: { comfyImages: [], buildSteps: [], buildText: "", blendVersions: [] },
    usage: [],
  };
}
