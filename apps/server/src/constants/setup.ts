import os from "node:os";
import path from "node:path";

/** Official download pages opened by the setup cards' Download button (no auto-install; decided 2026-10-01). */
export const DOWNLOAD_URLS = {
  blender: "https://www.blender.org/download/",
  comfy: "https://www.comfy.org/download",
} as const;

/** Where the newest release numbers are read from (official sources). */
export const LATEST_VERSION_SOURCES = {
  /** Directory listing with one "BlenderX.Y/" folder per release line. */
  blender: "https://download.blender.org/release/",
  comfy: "https://api.github.com/repos/comfyanonymous/ComfyUI/releases/latest",
} as const;

/** Days between automatic newest-version lookups for each Settings → General → "Check for new versions" choice. */
export const UPDATE_CHECK_DAYS = { daily: 1, weekly: 7 } as const;

/** blender-mcp's addon needs Python 3.10, which Blender ships from 3.1 on. */
export const MIN_BLENDER_VERSION = "3.1";

const env = (name: string) => process.env[name] ?? "";

/** Folders that may contain one or more `Blender x.y` installs (each with blender.exe). */
export const BLENDER_PARENT_DIRS = [
  path.join(env("ProgramFiles"), "Blender Foundation"),
  path.join(env("LOCALAPPDATA"), "Programs", "Blender Foundation"),
];

/** Fixed blender.exe locations (e.g. Steam). */
export const BLENDER_EXE_CANDIDATES = [
  path.join(env("ProgramFiles(x86)"), "Steam", "steamapps", "common", "Blender", "blender.exe"),
];

/** Usual places people unzip ComfyUI portable. */
export const COMFY_FOLDER_CANDIDATES = [
  "C:\\ComfyUI_windows_portable",
  path.join(os.homedir(), "ComfyUI_windows_portable"),
  path.join(os.homedir(), "Desktop", "ComfyUI_windows_portable"),
  path.join(os.homedir(), "Downloads", "ComfyUI_windows_portable"),
  path.join(os.homedir(), "ComfyUI"),
];

/** How long `blender --version` may take (it loads Blender briefly). */
export const BLENDER_VERSION_TIMEOUT_MS = 20_000;
