import type { ModelInfo } from "../types/models.ts";
import type { Provider } from "./providers.ts";

/**
 * Small built-in model lists, used until the full live lists are downloaded
 * (automatically once per app launch, or via "Refresh model lists"). Keep these short.
 */
export const FALLBACK_MODELS: Record<Provider, ModelInfo[]> = {
  anthropic: [
    { id: "claude-opus-5-5", name: "Claude Opus 5.5" },
    { id: "claude-fable-5-1", name: "Claude Fable 5.1" },
    { id: "claude-sonnet-5", name: "Claude Sonnet 5" },
    { id: "claude-haiku-4-5-20251001", name: "Claude Haiku 4.5" },
  ],
  openai: [
    { id: "gpt-5", name: "GPT-5" },
    { id: "gpt-5-mini", name: "GPT-5 mini" },
  ],
  google: [
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  ],
  openrouter: [
    { id: "anthropic/claude-haiku-4.5", name: "Anthropic: Claude Haiku 4.5" },
    { id: "openai/gpt-5", name: "OpenAI: GPT-5" },
    { id: "google/gemini-2.5-pro", name: "Google: Gemini 2.5 Pro" },
  ],
  gateway: [
    { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5" },
    { id: "openai/gpt-5", name: "GPT-5" },
    { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  ],
  huggingface: [
    { id: "Qwen/Qwen3.8-27B", name: "Qwen: Qwen3.8-27B" },
    { id: "google/gemma-4-31B-it", name: "google: gemma-4-31B-it" },
    { id: "moonshotai/Kimi-K3", name: "moonshotai: Kimi-K3" },
  ],
};

/** Cheap model per provider, used only for "is my key working?" tests. */
export const TEST_MODELS: Record<Provider, string> = {
  anthropic: "claude-haiku-4-5-20251001",
  openai: "gpt-5-mini",
  google: "gemini-2.5-flash",
  openrouter: "anthropic/claude-haiku-4.5",
  gateway: "openai/gpt-5-mini",
  huggingface: "meta-llama/Llama-3.1-8B-Instruct",
};
