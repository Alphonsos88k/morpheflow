/** Programs the setup check looks for (designs.md §3.0). */
export const SETUP_DEPS = ["blender", "comfy"] as const;
export type SetupDep = (typeof SETUP_DEPS)[number];

/**
 * - ok: found and usable
 * - missing: never configured and nothing found automatically
 * - too-old: found, but the version can't run what we need
 * - moved: a path that used to be set no longer exists
 */
export type SetupState = "ok" | "missing" | "too-old" | "moved";

export interface DepStatus {
  state: SetupState;
  /** Path in use or found (exe for Blender, folder/command for ComfyUI). */
  path: string | null;
  /** e.g. "4.2" for Blender, when known. */
  version: string | null;
  /** Newest release on the official site (e.g. "5.2.2"); null if offline or unknown. */
  latestVersion: string | null;
  /** When the newest version was last looked up (ISO); null if never. */
  latestCheckedAt: string | null;
  /** Installed version is older than the newest release (only when both are known). */
  updateAvailable: boolean;
  /** One plain sentence for the setup card. */
  message: string;
  /** Official download page, opened by the card's Download button. */
  downloadUrl: string;
}

export type SetupStatus = Record<SetupDep, DepStatus>;
