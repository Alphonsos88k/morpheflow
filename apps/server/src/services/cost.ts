import fs from "node:fs";
import {
  HOST_PROVIDERS,
  type LlmTask,
  type ModelPricing,
  type Provider,
  type UsageEntry,
} from "@morpheflow/spec";
import { PRICE_OVERRIDES_FILE } from "../constants/files.ts";
import { fromRoot } from "../lib/paths.ts";
import { getModelCatalog } from "./modelCatalog.ts";

/** Publisher prefix used by host providers for each direct provider's models. */
const HOST_PREFIX: Partial<Record<Provider, string>> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
};

/**
 * Makes model IDs from different providers comparable:
 * "anthropic/claude-haiku-4.5" and "claude-haiku-4-5-20251001" both become "claude-haiku-4-5".
 * @param id - Any model ID.
 */
export function normalizeModelId(id: string): string {
  return id
    .toLowerCase()
    .replace(/^[^/]+\//, "")
    .replace(/[._]/g, "-")
    .replace(/-\d{8}$/, "");
}

/**
 * Estimated USD for one call.
 * @param inputTokens - Prompt tokens.
 * @param outputTokens - Reply tokens.
 * @param pricing - USD per million tokens.
 */
export function costOf(inputTokens: number, outputTokens: number, pricing: ModelPricing): number {
  return (inputTokens * pricing.inputPerMTok + outputTokens * pricing.outputPerMTok) / 1_000_000;
}

/** User price overrides from config/prices.local.json, keyed "provider:model". */
function loadOverrides(): Record<string, ModelPricing> {
  const file = fromRoot(PRICE_OVERRIDES_FILE);
  return fs.existsSync(file)
    ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, ModelPricing>)
    : {};
}

/**
 * Best known price for a model: override file → the provider's own list → the same model's
 * list price on a host provider (OpenRouter/Gateway pass through list prices) → null.
 * @param provider - Provider the call went through.
 * @param model - Model ID as used with that provider.
 */
export function priceFor(provider: Provider, model: string): ModelPricing | null {
  const override = loadOverrides()[`${provider}:${model}`];
  if (override) return override;

  const { models } = getModelCatalog();
  const own = models[provider].find((m) => m.id === model)?.pricing;
  if (own) return own;

  const prefix = HOST_PREFIX[provider];
  if (!prefix) return null;
  const wanted = normalizeModelId(model);
  for (const host of HOST_PROVIDERS) {
    const match = models[host].find(
      (m) => m.id.startsWith(`${prefix}/`) && normalizeModelId(m.id) === wanted,
    );
    if (match?.pricing) return match.pricing;
  }
  return null;
}

/**
 * Builds a usage record from an AI SDK result's token counts.
 * @param task - Which job made the call.
 * @param provider - Provider used.
 * @param model - Model ID used.
 * @param usage - `totalUsage` from the AI SDK (counts may be undefined).
 */
export function recordUsage(
  task: LlmTask | "test",
  provider: Provider,
  model: string,
  usage: { inputTokens?: number; outputTokens?: number },
): UsageEntry {
  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const pricing = priceFor(provider, model);
  return {
    at: new Date().toISOString(),
    task,
    provider,
    model,
    inputTokens,
    outputTokens,
    cost: pricing ? costOf(inputTokens, outputTokens, pricing) : null,
  };
}
