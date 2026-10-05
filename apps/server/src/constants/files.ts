/** Files the server reads/writes, relative to the repo root. `*.local.*` and logs are gitignored. */
export const SETTINGS_FILE = "config/settings.local.json";
export const MODEL_CACHE_FILE = "config/models.local.json";
/** Newest Blender/ComfyUI versions and when they were looked up. */
export const VERSIONS_CACHE_FILE = "config/versions.local.json";

/** Optional price overrides, `{ "provider:model": { "inputPerMTok": 3, "outputPerMTok": 15 } }`. Beats every other source. */
export const PRICE_OVERRIDES_FILE = "config/prices.local.json";

export const LOG_FILE = "logs/server.log";
/** Rotate the log after 5 MB (one old file is kept). */
export const LOG_MAX_BYTES = 5 * 1024 * 1024;

/** Inside each session folder (`outputs/<id>/`). */
export const SESSION_FILE = "session.json";

/** Folder the custom-background picker opens in by default (the built-in patterns live here). */
export const PATTERNS_DIR = "apps/web/src/assets/patterns";

/** Image types allowed as a custom background, with the content type sent to the browser. */
export const BACKGROUND_TYPES: Record<string, string> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};
