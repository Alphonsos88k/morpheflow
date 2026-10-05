import type { LlmTask, Provider } from "../constants/providers.ts";

/** USD per 1 million tokens. */
export interface ModelPricing {
  inputPerMTok: number;
  outputPerMTok: number;
}

/** One AI call's token usage and estimated cost (designs.md §6.2). */
export interface UsageEntry {
  /** ISO time of the call. */
  at: string;
  task: LlmTask | "test";
  provider: Provider;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** Estimated USD; null when no price is known for this model. */
  cost: number | null;
}
