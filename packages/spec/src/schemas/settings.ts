import { z } from "zod";
import { LLM_TASKS, PROVIDERS, type Provider } from "../constants/providers.ts";

export const ProviderSchema = z.enum(PROVIDERS);

/** Which provider + model runs one kind of AI job. */
export const ModelChoiceSchema = z.object({
  provider: ProviderSchema,
  model: z.string().min(1),
});
export type ModelChoice = z.infer<typeof ModelChoiceSchema>;

export const SettingsSchema = z.object({
  app: z.object({
    serverPort: z.number().int().positive(),
    webPort: z.number().int().positive(),
    outputsDir: z.string(),
    refsDir: z.string(),
    /** Session saving: every N seconds, Ctrl+S only, or both (designs.md §5.2). */
    saveMode: z.enum(["auto", "manual", "both"]),
    autosaveSeconds: z.number().int().min(3).max(600),
    /** Show the setup card when a program is missing (false = "Don't ask again"). */
    setupChecks: z.object({ blender: z.boolean(), comfy: z.boolean() }),
    /** When to look up the newest Blender/ComfyUI versions: once a day, once a week, or only on "Check now". */
    updateCheck: z.enum(["daily", "weekly", "manual"]),
    /** Decorative pattern behind the main area (files in apps/web/src/assets/patterns). */
    backgroundPattern: z.enum(["voxels", "floor", "dots", "none"]),
    /** Image file (svg/png/jpg/webp) that overrides backgroundPattern when set; "" = use the pattern. */
    customBackground: z.string(),
  }),
  llm: z.object({
    /** One API key per provider; "" = not set. */
    apiKeys: z.record(ProviderSchema, z.string()),
    tasks: z.record(z.enum(LLM_TASKS), ModelChoiceSchema),
  }),
  comfy: z.object({
    url: z.url(),
    /** Empty = auto-detect from `workingDir` or a ComfyUI Desktop install. */
    launchCommand: z.string(),
    workingDir: z.string(),
    workflowTemplate: z.string(),
    /** Node IDs inside the workflow template that the app fills in. */
    nodeMap: z.object({
      positive: z.string(),
      negative: z.string(),
      sampler: z.string(),
      checkpoint: z.string(),
    }),
    checkpoint: z.string(),
    /** Version found by the setup check (read-only in the UI); "" = unknown. */
    detectedVersion: z.string(),
  }),
  blender: z.object({
    exePath: z.string(),
    mcpCommand: z.string(),
    mcpArgs: z.array(z.string()),
    host: z.string(),
    port: z.number().int().positive(),
    stepBudget: z.number().int().min(1).max(100),
    recipesDir: z.string(),
    startupScript: z.string(),
    /** Version found by the setup check (read-only in the UI); "" = unknown. */
    detectedVersion: z.string(),
  }),
});
export type Settings = z.infer<typeof SettingsSchema>;

/** Settings as sent to the browser: API keys replaced by "is it set?" flags. */
export type PublicSettings = Omit<Settings, "llm"> & {
  llm: Omit<Settings["llm"], "apiKeys"> & { keysSet: Record<Provider, boolean> };
};

/** Partial update sent from the browser. Empty/omitted API keys leave the saved key untouched. */
export type SettingsPatch = {
  [K in Exclude<keyof Settings, "llm">]?: Partial<Settings[K]>;
} & {
  llm?: { tasks?: Settings["llm"]["tasks"]; apiKeys?: Partial<Record<Provider, string>> };
};
