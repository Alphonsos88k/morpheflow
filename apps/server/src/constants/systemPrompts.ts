/** Folder holding the AI instructions for each stage (relative to the repo root). */
export const SYSTEM_PROMPTS_DIR = "system_prompts";

/** One file per stage: `system_prompts/<name>.md`. See system_prompts/README.md. */
export const SYSTEM_PROMPT_NAMES = [
  "clarify",
  "enhance_prompt",
  "vision_reading",
  "build_plan",
  "blender_agent",
  "suggestions",
  "comfy_suggestor",
] as const;
export type SystemPromptName = (typeof SYSTEM_PROMPT_NAMES)[number];
