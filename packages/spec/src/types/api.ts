import type { Provider } from "../constants/providers.ts";
import type { UsageEntry } from "./cost.ts";
import type { ActiveModel, ModelRefreshStatus } from "./models.ts";

/** Connection state of one outside service, shown as a status dot. */
export type ServiceState = "up" | "down" | "starting" | "unknown";

export interface HealthResponse {
  comfy: ServiceState;
  blender: ServiceState;
  llm: ServiceState;
  /** Blender agent's model; null when no key is set for its provider. */
  llmModel: ActiveModel | null;
  models: ModelRefreshStatus;
}

export interface LlmTestResponse {
  provider: Provider;
  ok: boolean;
  reply?: string;
  error?: string;
}

export interface ComfyGenerateResponse {
  /** URLs (served by our backend) of the generated images. */
  images: string[];
}

/** One tool call the Blender agent made, for the live log. */
export interface AgentStep {
  tool: string;
  summary: string;
}

export interface BlenderRunResponse {
  steps: AgentStep[];
  finalText: string;
  usage: UsageEntry;
  /** Path of the .blend backup saved before this run; null if saving failed (e.g. empty scene). */
  blendVersion: string | null;
}

export interface BlenderToolsResponse {
  tools: string[];
}

export interface PickPathResponse {
  /** Chosen path, or null if the user cancelled. */
  path: string | null;
}

/** Error shape every failing API route returns. */
export interface ApiError {
  error: string;
}
