import type { Provider } from "../constants/providers.ts";
import type { ModelPricing } from "./cost.ts";

/** One selectable AI model. */
export interface ModelInfo {
  id: string;
  /** Human-readable name, when the provider gives one. */
  name?: string;
  /** List price, when the provider's model list includes it (OpenRouter, Vercel AI Gateway). */
  pricing?: ModelPricing;
}

/** The model currently in use, as shown in the status pill. */
export interface ActiveModel {
  id: string;
  /** Display name without the publisher prefix, e.g. "GPT-5". */
  name: string;
  /** Who made the model, e.g. "OpenAI". */
  publisher: string;
  /** Which API we call it through. */
  provider: Provider;
}

/** Background model-list refresh, reported with every health check so the UI can announce it. */
export interface ModelRefreshStatus {
  refreshing: boolean;
  /** ISO time the last refresh finished; null if none has finished since the server started. */
  finishedAt: string | null;
  /** Models found per provider in that refresh. */
  counts: Partial<Record<Provider, number>>;
  /** Providers skipped because no API key is saved. */
  skipped: Provider[];
  errors: string[];
}

/** Model lists per provider, as shown in Settings → AI models. */
export interface ModelCatalog {
  models: Record<Provider, ModelInfo[]>;
  /** ISO date of the last successful refresh per provider; missing = built-in fallback list. */
  updatedAt: Partial<Record<Provider, string>>;
}
