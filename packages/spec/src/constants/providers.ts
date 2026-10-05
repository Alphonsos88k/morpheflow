/** AI providers the app can call. Add a provider here, then in llm.ts and modelCatalog.ts on the server. */
export const PROVIDERS = [
  "anthropic",
  "openai",
  "google",
  "openrouter",
  "gateway",
  "huggingface",
] as const;
export type Provider = (typeof PROVIDERS)[number];

/** Providers that host models from many publishers; their model IDs look like "openai/gpt-5". */
export const HOST_PROVIDERS: readonly Provider[] = ["openrouter", "gateway", "huggingface"];

/** Providers whose full model list can be downloaded without an API key. All others need a saved key. */
export const KEYLESS_MODEL_LISTS: readonly Provider[] = ["openrouter", "huggingface"];

/** AI jobs that can each use a different model (designs.md §6). */
export const LLM_TASKS = [
  "promptEnhancer",
  "vision",
  "buildPlan",
  "blenderAgent",
  "suggestions",
] as const;
export type LlmTask = (typeof LLM_TASKS)[number];

/** Human names + one-line purpose for each AI job (Settings → AI models). */
export const LLM_TASK_INFO: Record<LlmTask, { label: string; hint: string }> = {
  promptEnhancer: { label: "Prompt enhancer", hint: "Clarify questions + image prompt" },
  vision: { label: "Vision", hint: "Reads inspiration images" },
  buildPlan: { label: "Build plan", hint: "Writes the plan you approve" },
  blenderAgent: { label: "Blender agent", hint: "Builds the scene in Blender" },
  suggestions: { label: "Suggestions", hint: 'Idea chips like "kitsune?"' },
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  openrouter: "OpenRouter",
  gateway: "Vercel AI Gateway",
  huggingface: "Hugging Face",
};

/** Nice names for the "publisher/" prefix of host model IDs. Unknown prefixes are capitalized. */
export const PUBLISHER_NAMES: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  "meta-llama": "Meta",
  meta: "Meta",
  "x-ai": "xAI",
  xai: "xAI",
  mistralai: "Mistral",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  "deepseek-ai": "DeepSeek",
  "zai-org": "Z.ai",
  qwen: "Qwen",
  alibaba: "Alibaba",
  moonshotai: "Moonshot",
  cohere: "Cohere",
};
