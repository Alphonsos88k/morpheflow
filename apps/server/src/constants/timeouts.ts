/** How long after "Launch" a service shows "starting" instead of "down". */
export const COMFY_STARTUP_GRACE_MS = 3 * 60_000;
export const BLENDER_STARTUP_GRACE_MS = 90_000;

/** Health checks must be quick so status dots stay responsive. */
export const HEALTH_CHECK_TIMEOUT_MS = 1500;

/** ComfyUI generation: how often to poll, and when to give up. */
export const COMFY_POLL_INTERVAL_MS = 1000;
export const COMFY_GENERATE_TIMEOUT_MS = 5 * 60_000;

/** Model list downloads. */
export const MODEL_LIST_TIMEOUT_MS = 15_000;
