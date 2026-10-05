import fs from "node:fs";
import path from "node:path";
import {
  DEFAULT_SETTINGS,
  PROVIDERS,
  SettingsSchema,
  deepMerge,
  type Provider,
  type PublicSettings,
  type Settings,
  type SettingsPatch,
} from "@morpheflow/spec";
import { SETTINGS_FILE as SETTINGS_PATH } from "../constants/files.ts";
import { fromRoot } from "../lib/paths.ts";

const SETTINGS_FILE = fromRoot(SETTINGS_PATH);

let cached: Settings | null = null;
const listeners = new Set<(settings: Settings) => void>();

type SavedLlm = {
  anthropicApiKey?: string;
  openrouterApiKey?: string;
  apiKeys?: Record<string, string>;
};

/**
 * Moves keys saved by older versions (`llm.anthropicApiKey`, `llm.openrouterApiKey`) into `llm.apiKeys`.
 * @param saved - Raw JSON from the settings file.
 */
export function migrateLegacyKeys(saved: Record<string, unknown>): Record<string, unknown> {
  const llm = saved.llm as SavedLlm | undefined;
  if (!llm || (llm.anthropicApiKey === undefined && llm.openrouterApiKey === undefined))
    return saved;
  const { anthropicApiKey, openrouterApiKey, ...rest } = llm;
  const apiKeys = {
    ...rest.apiKeys,
    anthropic: anthropicApiKey ?? "",
    openrouter: openrouterApiKey ?? "",
  };
  return { ...saved, llm: { ...rest, apiKeys } };
}

/** Current settings: defaults overlaid with `config/settings.local.json`. */
export function getSettings(): Settings {
  if (cached) return cached;
  const saved = fs.existsSync(SETTINGS_FILE)
    ? (JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as Record<string, unknown>)
    : {};
  cached = SettingsSchema.parse(deepMerge(DEFAULT_SETTINGS, migrateLegacyKeys(saved)));
  return cached;
}

/**
 * The saved API key for a provider ("" when not set).
 * @param provider - Which provider.
 */
export const apiKeyFor = (provider: Provider): string => getSettings().llm.apiKeys[provider];

/**
 * Applies a partial update, validates it, and saves it to disk.
 * Empty API key fields keep the saved key, so the browser never needs to know it.
 * @param patch - Changed fields from the Settings panel.
 * @returns The new settings.
 */
export function updateSettings(patch: SettingsPatch): Settings {
  const apiKeys = Object.fromEntries(
    Object.entries(patch.llm?.apiKeys ?? {}).filter(([, key]) => key),
  );
  const llm = { ...patch.llm, apiKeys };

  const next = SettingsSchema.parse(deepMerge(getSettings(), { ...patch, llm }));
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(next, null, 2));
  cached = next;
  listeners.forEach((fn) => fn(next));
  return next;
}

/**
 * Registers a callback for settings changes (e.g. to reconnect to Blender with new ports).
 * @param fn - Called with the new settings after every save.
 */
export function onSettingsChange(fn: (settings: Settings) => void): void {
  listeners.add(fn);
}

/**
 * Removes API keys before settings are sent to the browser.
 * @param settings - Full settings including keys.
 */
export function toPublicSettings(settings: Settings): PublicSettings {
  const { apiKeys, ...llm } = settings.llm;
  const keysSet = Object.fromEntries(PROVIDERS.map((p) => [p, apiKeys[p] !== ""])) as Record<
    Provider,
    boolean
  >;
  return { ...settings, llm: { ...llm, keysSet } };
}
