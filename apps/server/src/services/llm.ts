import { createAnthropic } from "@ai-sdk/anthropic";
import { createGateway } from "@ai-sdk/gateway";
import { createGoogle } from "@ai-sdk/google";
import { createHuggingFace } from "@ai-sdk/huggingface";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateText, type LanguageModel } from "ai";
import {
  HOST_PROVIDERS,
  PROVIDER_LABELS,
  PUBLISHER_NAMES,
  TEST_MODELS,
  type ActiveModel,
  type LlmTask,
  type LlmTestResponse,
  type Provider,
  type ServiceState,
} from "@morpheflow/spec";
import { AppError, errorMessage } from "../lib/errors.ts";
import { getModelCatalog } from "./modelCatalog.ts";
import { apiKeyFor, getSettings } from "./settingsStore.ts";

/** How to build an AI SDK model for each provider, given its API key. */
const MODEL_FACTORIES: Record<Provider, (apiKey: string, modelId: string) => LanguageModel> = {
  anthropic: (apiKey, id) => createAnthropic({ apiKey })(id),
  openai: (apiKey, id) => createOpenAI({ apiKey })(id),
  google: (apiKey, id) => createGoogle({ apiKey })(id),
  openrouter: (apiKey, id) => createOpenRouter({ apiKey }).chat(id),
  gateway: (apiKey, id) => createGateway({ apiKey })(id),
  huggingface: (apiKey, id) => createHuggingFace({ apiKey })(id),
};

/**
 * Builds an AI SDK model for a provider, using the saved API key.
 * @param provider - Which API to call.
 * @param modelId - Provider-specific model ID.
 * @throws AppError when the provider's key is missing.
 */
export function createModel(provider: Provider, modelId: string): LanguageModel {
  const apiKey = apiKeyFor(provider);
  if (!apiKey)
    throw new AppError(`${PROVIDER_LABELS[provider]} API key is not set (Settings → AI models).`);
  return MODEL_FACTORIES[provider](apiKey, modelId);
}

/**
 * The model the user picked for one kind of job.
 * @param task - Which job (e.g. "blenderAgent").
 */
export function modelForTask(task: LlmTask): LanguageModel {
  const choice = getSettings().llm.tasks[task];
  if (!choice) throw new AppError(`No model configured for task "${task}".`);
  return createModel(choice.provider, choice.model);
}

/**
 * Sends a tiny request to check that a provider's key works.
 * @param provider - Which API to test.
 */
export async function testProvider(provider: Provider): Promise<LlmTestResponse> {
  try {
    const { text } = await generateText({
      model: createModel(provider, TEST_MODELS[provider]),
      prompt: "Reply with exactly one word: ok",
      maxOutputTokens: 8,
    });
    return { provider, ok: true, reply: text.trim() };
  } catch (err) {
    return { provider, ok: false, error: errorMessage(err) };
  }
}

/** "up" when the Blender agent's provider has a key; a real call happens only on Test. */
export function llmStatus(): ServiceState {
  const provider = getSettings().llm.tasks.blenderAgent?.provider ?? "anthropic";
  return apiKeyFor(provider) ? "up" : "down";
}

/**
 * Describes the Blender agent's model for the status pill, or null when its provider has no key.
 */
export function activeModel(): ActiveModel | null {
  const choice = getSettings().llm.tasks.blenderAgent;
  if (!choice || llmStatus() !== "up") return null;
  const listed = getModelCatalog().models[choice.provider].find((m) => m.id === choice.model);
  return describeModel(choice.provider, choice.model, listed?.name);
}

/**
 * Name, publisher, and provider for a model. Host providers (OpenRouter, Gateway) use
 * "publisher/model" IDs, and OpenRouter names look like "OpenAI: GPT-5", so the publisher comes
 * from the name or the ID prefix.
 * @param provider - Provider the model is called through.
 * @param id - Model ID.
 * @param listedName - Display name from the model list, if any.
 */
export function describeModel(provider: Provider, id: string, listedName?: string): ActiveModel {
  if (!HOST_PROVIDERS.includes(provider)) {
    return { id, name: listedName ?? id, publisher: PROVIDER_LABELS[provider], provider };
  }
  const [prefix = "", rest] = id.split("/");
  const [namedPublisher, namedModel] = listedName?.includes(": ") ? listedName.split(": ") : [];
  const publisher =
    namedPublisher ?? PUBLISHER_NAMES[prefix] ?? prefix.charAt(0).toUpperCase() + prefix.slice(1);
  return { id, name: namedModel ?? listedName ?? rest ?? id, publisher, provider };
}
