import fs from "node:fs";
import { createGateway } from "@ai-sdk/gateway";
import {
  FALLBACK_MODELS,
  KEYLESS_MODEL_LISTS,
  PROVIDERS,
  PROVIDER_LABELS,
  type ModelCatalog,
  type ModelInfo,
  type ModelPricing,
  type ModelRefreshStatus,
  type Provider,
} from "@morpheflow/spec";
import { MODEL_CACHE_FILE } from "../constants/files.ts";
import { MODEL_LIST_TIMEOUT_MS } from "../constants/timeouts.ts";
import { errorMessage } from "../lib/errors.ts";
import { fetchJson } from "../lib/fetchJson.ts";
import { fromRoot } from "../lib/paths.ts";
import { apiKeyFor } from "./settingsStore.ts";

const CACHE_PATH = fromRoot(MODEL_CACHE_FILE);

/** OpenAI's list includes audio, image, and embedding models; keep chat-capable ones only. */
const OPENAI_CHAT = /^(gpt-|o\d|chatgpt)/;
const OPENAI_NOT_CHAT = /(audio|realtime|tts|transcribe|image|search|embedding|instruct)/;

const byId = (a: ModelInfo, b: ModelInfo) => a.id.localeCompare(b.id);

/** Host providers report USD per single token as strings. */
type PerTokenPrice = { prompt?: string; completion?: string };

/**
 * Converts per-token price strings to USD per million tokens.
 * @returns undefined when either price is missing or not a number.
 */
function toPricing(input?: string, output?: string): ModelPricing | undefined {
  const i = Number(input);
  const o = Number(output);
  if (input === undefined || output === undefined || Number.isNaN(i) || Number.isNaN(o))
    return undefined;
  return { inputPerMTok: i * 1_000_000, outputPerMTok: o * 1_000_000 };
}

/** Downloads one provider's model list (free: no AI tokens). Receives the saved key, "" if none. */
const FETCHERS: Record<Provider, (apiKey: string) => Promise<ModelInfo[]>> = {
  anthropic: async (apiKey) => {
    const res = await fetchJson<{ data: { id: string; display_name?: string }[] }>(
      "https://api.anthropic.com/v1/models?limit=1000",
      { headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" } },
      MODEL_LIST_TIMEOUT_MS,
    );
    return res.data.map((m) => ({ id: m.id, name: m.display_name }));
  },
  openai: async (apiKey) => {
    const res = await fetchJson<{ data: { id: string }[] }>(
      "https://api.openai.com/v1/models",
      { headers: { Authorization: `Bearer ${apiKey}` } },
      MODEL_LIST_TIMEOUT_MS,
    );
    return res.data
      .filter((m) => OPENAI_CHAT.test(m.id) && !OPENAI_NOT_CHAT.test(m.id))
      .map((m) => ({ id: m.id }))
      .sort(byId);
  },
  google: async (apiKey) => {
    const res = await fetchJson<{
      models: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
    }>(
      "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
      { headers: { "x-goog-api-key": apiKey } },
      MODEL_LIST_TIMEOUT_MS,
    );
    return res.models
      .filter((m) => m.supportedGenerationMethods?.includes("generateContent"))
      .map((m) => ({ id: m.name.replace(/^models\//, ""), name: m.displayName }))
      .sort(byId);
  },
  openrouter: async () => {
    const res = await fetchJson<{ data: { id: string; name?: string; pricing?: PerTokenPrice }[] }>(
      "https://openrouter.ai/api/v1/models",
      {},
      MODEL_LIST_TIMEOUT_MS,
    );
    return res.data
      .map((m) => ({
        id: m.id,
        name: m.name,
        pricing: toPricing(m.pricing?.prompt, m.pricing?.completion),
      }))
      .sort(byId);
  },
  gateway: async (apiKey) => {
    const { models } = await createGateway({ apiKey }).getAvailableModels();
    return models
      .filter((m) => !m.modelType || m.modelType === "language")
      .map((m) => ({
        id: m.id,
        name: m.name,
        pricing: toPricing(m.pricing?.input, m.pricing?.output),
      }))
      .sort(byId);
  },
  huggingface: async () => {
    const res = await fetchJson<{ data: HfRouterModel[] }>(
      "https://router.huggingface.co/v1/models",
      {},
      MODEL_LIST_TIMEOUT_MS,
    );
    return res.data
      .map((m) => ({
        id: m.id,
        name: m.owned_by ? `${m.owned_by}: ${m.id.split("/").at(-1)}` : undefined,
        pricing: hfPricing(m),
      }))
      .sort(byId);
  },
};

/** One entry of Hugging Face's router model list (public, no key needed). */
interface HfRouterModel {
  id: string;
  owned_by?: string;
  providers?: { status?: string; pricing?: { input?: number; output?: number } }[];
}

/**
 * Cheapest live price across the inference providers HF routes to (already USD per million tokens).
 * The router may pick a different provider, so this is an estimate.
 */
function hfPricing(model: HfRouterModel): ModelPricing | undefined {
  const priced = (model.providers ?? []).filter(
    (p) => p.status === "live" && p.pricing?.input !== undefined && p.pricing.output !== undefined,
  );
  if (priced.length === 0) return undefined;
  const cheapest = priced.reduce((a, b) =>
    (b.pricing?.input ?? 0) < (a.pricing?.input ?? 0) ? b : a,
  );
  return {
    inputPerMTok: cheapest.pricing?.input ?? 0,
    outputPerMTok: cheapest.pricing?.output ?? 0,
  };
}

let status: ModelRefreshStatus = {
  refreshing: false,
  finishedAt: null,
  counts: {},
  skipped: [],
  errors: [],
};

/** Progress of the latest background refresh (sent with every health check). */
export const getRefreshStatus = (): ModelRefreshStatus => status;

/** Saved model lists, or the built-in fallback for providers never fetched. */
export function getModelCatalog(): ModelCatalog {
  if (!fs.existsSync(CACHE_PATH)) return { models: FALLBACK_MODELS, updatedAt: {} };
  const saved = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) as ModelCatalog;
  return { models: { ...FALLBACK_MODELS, ...saved.models }, updatedAt: saved.updatedAt };
}

/**
 * Refreshes every provider's model list and saves the result. Providers without a key are
 * skipped; one that fails keeps its previous list. Safe to call while a refresh is running.
 * @returns The updated catalog and what happened.
 */
export async function refreshModelCatalog(): Promise<{
  catalog: ModelCatalog;
  status: ModelRefreshStatus;
}> {
  const catalog = getModelCatalog();
  const next: ModelRefreshStatus = {
    refreshing: true,
    finishedAt: null,
    counts: {},
    skipped: [],
    errors: [],
  };
  status = { ...status, refreshing: true };

  await Promise.all(
    PROVIDERS.map(async (provider) => {
      const apiKey = apiKeyFor(provider);
      if (!KEYLESS_MODEL_LISTS.includes(provider) && !apiKey)
        return void next.skipped.push(provider);
      try {
        catalog.models[provider] = await FETCHERS[provider](apiKey);
        catalog.updatedAt[provider] = new Date().toISOString();
        next.counts[provider] = catalog.models[provider].length;
      } catch (err) {
        next.errors.push(`${PROVIDER_LABELS[provider]}: ${errorMessage(err)}`);
      }
    }),
  );

  fs.writeFileSync(CACHE_PATH, JSON.stringify(catalog, null, 2));
  status = { ...next, refreshing: false, finishedAt: new Date().toISOString() };
  return { catalog, status };
}
