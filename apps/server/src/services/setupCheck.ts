import { execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import {
  SETUP_DEPS,
  type DepStatus,
  type SetupDep,
  type SetupStatus,
  type Settings,
} from "@morpheflow/spec";
import { PORTABLE_LAUNCH_SCRIPTS } from "../constants/comfy.ts";
import { VERSIONS_CACHE_FILE } from "../constants/files.ts";
import {
  BLENDER_EXE_CANDIDATES,
  BLENDER_PARENT_DIRS,
  BLENDER_VERSION_TIMEOUT_MS,
  COMFY_FOLDER_CANDIDATES,
  DOWNLOAD_URLS,
  UPDATE_CHECK_DAYS,
  LATEST_VERSION_SOURCES,
  MIN_BLENDER_VERSION,
} from "../constants/setup.ts";
import { fetchJson } from "../lib/fetchJson.ts";
import { log } from "../lib/logger.ts";
import { fromRoot } from "../lib/paths.ts";
import { findComfyLaunch } from "./comfy.ts";
import { getSettings, updateSettings } from "./settingsStore.ts";

const run = promisify(execFile);

/** What each check finds before the newest-version info is added. */
type FoundStatus = Omit<DepStatus, "latestVersion" | "latestCheckedAt" | "updateAvailable">;

/**
 * Compares dotted versions numerically ("3.10" > "3.9").
 * @returns negative if a < b, 0 if equal, positive if a > b.
 */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/**
 * Blender version from an install path like ".../Blender 4.2/blender.exe".
 * @returns "4.2", or null when the folder name doesn't say.
 */
export function versionFromPath(exe: string): string | null {
  return path.dirname(exe).match(/Blender[ -]?(\d+\.\d+)/i)?.[1] ?? null;
}

const versionCache = new Map<string, string | null>();

/** Blender version: from the folder name, else `blender --version` (cached per path). */
async function blenderVersion(exe: string): Promise<string | null> {
  const fromName = versionFromPath(exe);
  if (fromName) return fromName;
  if (versionCache.has(exe)) return versionCache.get(exe) ?? null;
  let version: string | null = null;
  try {
    const { stdout } = await run(exe, ["--version"], {
      timeout: BLENDER_VERSION_TIMEOUT_MS,
      windowsHide: true,
    });
    version = stdout.match(/Blender (\d+\.\d+)/)?.[1] ?? null;
  } catch (err) {
    log.warn(`Couldn't read Blender version from ${exe}`, err instanceof Error ? err.message : err);
  }
  versionCache.set(exe, version);
  return version;
}

/** Every blender.exe in the usual install folders. */
function findBlenderInstalls(): string[] {
  const found = BLENDER_EXE_CANDIDATES.filter((exe) => fs.existsSync(exe));
  for (const parent of BLENDER_PARENT_DIRS) {
    if (!fs.existsSync(parent)) continue;
    for (const dir of fs.readdirSync(parent)) {
      const exe = path.join(parent, dir, "blender.exe");
      if (fs.existsSync(exe)) found.push(exe);
    }
  }
  return found;
}

const tooOld = (v: string | null) => v !== null && compareVersions(v, MIN_BLENDER_VERSION) < 0;

async function checkBlender(): Promise<FoundStatus> {
  const base = { downloadUrl: DOWNLOAD_URLS.blender };
  const configured = getSettings().blender.exePath;

  if (configured) {
    if (!fs.existsSync(configured)) {
      return {
        ...base,
        state: "moved",
        path: configured,
        version: null,
        message: `Blender was at ${configured} but isn't there anymore.`,
      };
    }
    const version = await blenderVersion(configured);
    if (tooOld(version)) {
      return {
        ...base,
        state: "too-old",
        path: configured,
        version,
        message: `Blender ${version} found, but ${MIN_BLENDER_VERSION} or newer is needed.`,
      };
    }
    return {
      ...base,
      state: "ok",
      path: configured,
      version,
      message: `Blender ${version ?? ""} ready.`.replace("  ", " "),
    };
  }

  // Nothing configured: pick the newest install we can find and fill it in (even if too old,
  // so Settings shows the path with a warning).
  const installs = await Promise.all(
    findBlenderInstalls().map(async (exe) => ({ exe, version: await blenderVersion(exe) })),
  );
  installs.sort((a, b) => compareVersions(b.version ?? "0", a.version ?? "0"));
  const best = installs[0];
  if (!best)
    return {
      ...base,
      state: "missing",
      path: null,
      version: null,
      message: "Blender isn't installed (or isn't in a usual place). It's needed to build scenes.",
    };
  updateSettings({ blender: { exePath: best.exe } });
  log.info(`Setup check: filled in Blender found at ${best.exe}`);
  if (tooOld(best.version)) {
    return {
      ...base,
      state: "too-old",
      path: best.exe,
      version: best.version,
      message: `Only Blender ${best.version} found; ${MIN_BLENDER_VERSION} or newer is needed.`,
    };
  }
  return {
    ...base,
    state: "ok",
    path: best.exe,
    version: best.version,
    message: `Found Blender ${best.version ?? ""} automatically.`,
  };
}

/** True when a folder looks like a ComfyUI install (portable launcher or git checkout). */
const isComfyFolder = (dir: string) =>
  [...PORTABLE_LAUNCH_SCRIPTS, "main.py"].some((f) => fs.existsSync(path.join(dir, f)));

/** First path-like part of a launch command, e.g. `"C:\\x\\run.bat"` → `C:\\x\\run.bat`; null for bare commands. */
const commandPath = (command: string) => {
  const first = command.match(/^"([^"]+)"|^(\S+)/);
  const p = first?.[1] ?? first?.[2] ?? "";
  return /[\\/]/.test(p) ? p : null;
};

function checkComfy(): FoundStatus {
  const base = { downloadUrl: DOWNLOAD_URLS.comfy, version: null };
  const { workingDir, launchCommand } = getSettings().comfy;

  const missingPath = [workingDir, commandPath(launchCommand)].find((p) => p && !fs.existsSync(p));
  if (missingPath)
    return {
      ...base,
      state: "moved",
      path: missingPath,
      message: `ComfyUI was at ${missingPath} but isn't there anymore.`,
    };

  const plan = findComfyLaunch();
  if (plan)
    return {
      ...base,
      state: "ok",
      path: plan.cwd || plan.command,
      version: comfyVersion(plan.cwd),
      message: "ComfyUI ready.",
    };

  const found = COMFY_FOLDER_CANDIDATES.find((dir) => fs.existsSync(dir) && isComfyFolder(dir));
  if (found) {
    updateSettings({ comfy: { workingDir: found } });
    log.info(`Setup check: using ComfyUI found at ${found}`);
    return {
      ...base,
      state: "ok",
      path: found,
      version: comfyVersion(found),
      message: "Found ComfyUI automatically.",
    };
  }
  return {
    ...base,
    state: "missing",
    path: null,
    message:
      "ComfyUI isn't installed (or isn't in a usual place). It's optional: it makes concept images.",
  };
}

/**
 * ComfyUI's own version number, read from `comfyui_version.py` in a git install or a portable
 * install's `ComfyUI/` subfolder. Null for the Desktop app or unknown layouts.
 * @param dir - ComfyUI folder (may be empty).
 */
export function comfyVersion(dir: string): string | null {
  if (!dir) return null;
  for (const file of [
    path.join(dir, "comfyui_version.py"),
    path.join(dir, "ComfyUI", "comfyui_version.py"),
  ]) {
    if (!fs.existsSync(file)) continue;
    return fs.readFileSync(file, "utf8").match(/__version__\s*=\s*["']([\d.]+)["']/)?.[1] ?? null;
  }
  return null;
}

/** Newest Blender release, from the official release listing (e.g. "5.2.2"). */
async function latestBlender(): Promise<string | null> {
  const res = await fetch(LATEST_VERSION_SOURCES.blender, { signal: AbortSignal.timeout(15_000) });
  const lines = [...(await res.text()).matchAll(/href="Blender(\d+\.\d+)\/"/g)].map(
    (m) => m[1] ?? "",
  );
  const newestLine = lines.sort(compareVersions).at(-1);
  if (!newestLine) return null;
  const page = await (
    await fetch(`${LATEST_VERSION_SOURCES.blender}Blender${newestLine}/`, {
      signal: AbortSignal.timeout(15_000),
    })
  ).text();
  const patches = [...page.matchAll(/blender-(\d+\.\d+\.\d+)-windows-x64\.zip/g)].map(
    (m) => m[1] ?? "",
  );
  return patches.sort(compareVersions).at(-1) ?? newestLine;
}

/** Newest ComfyUI release, from its official GitHub releases (e.g. "0.38.0"). */
async function latestComfy(): Promise<string | null> {
  const release = await fetchJson<{ tag_name?: string }>(
    LATEST_VERSION_SOURCES.comfy,
    { headers: { "User-Agent": "morpheflow" } },
    15_000,
  );
  return release.tag_name?.replace(/^v/, "") ?? null;
}

/** Newest known version per program and when it was looked up; saved in config/versions.local.json. */
type VersionCache = Record<SetupDep, { latest: string | null; checkedAt: string | null }>;

const EMPTY_CACHE: VersionCache = {
  blender: { latest: null, checkedAt: null },
  comfy: { latest: null, checkedAt: null },
};
const cachePath = () => fromRoot(VERSIONS_CACHE_FILE);

function loadVersionCache(): VersionCache {
  try {
    return {
      ...EMPTY_CACHE,
      ...(JSON.parse(fs.readFileSync(cachePath(), "utf8")) as Partial<VersionCache>),
    };
  } catch {
    return structuredClone(EMPTY_CACHE);
  }
}

/** Local calendar date, e.g. "2026-10-01", so "daily" means "once per day", not "every 24 h". */
const localDay = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

/**
 * Is an automatic newest-version lookup due? Based on today's date and the user's setting.
 * @param checkedAt - Last lookup (ISO), or null if never.
 * @param mode - Settings → General → "Check for new versions".
 * @param now - Current time (injectable for tests).
 */
export function isUpdateCheckDue(
  checkedAt: string | null,
  mode: Settings["app"]["updateCheck"],
  now = new Date(),
): boolean {
  if (mode === "manual") return false;
  if (!checkedAt) return true;
  const last = new Date(checkedAt);
  if (mode === "daily") return localDay(last) !== localDay(now);
  return now.getTime() - last.getTime() >= UPDATE_CHECK_DAYS.weekly * 24 * 60 * 60_000;
}

const FETCH_LATEST: Record<SetupDep, () => Promise<string | null>> = {
  blender: latestBlender,
  comfy: latestComfy,
};

/**
 * Newest versions of both programs. Looks them up only when due by date (or when forced by
 * "Check now"); otherwise uses the saved result. A failed lookup keeps the previous answer.
 * @param force - Ignore the schedule and look up now.
 */
async function latestVersions(force: boolean): Promise<VersionCache> {
  const cache = loadVersionCache();
  const mode = getSettings().app.updateCheck;
  const due = SETUP_DEPS.filter((dep) => force || isUpdateCheckDue(cache[dep].checkedAt, mode));
  if (due.length === 0) return cache;

  await Promise.all(
    due.map(async (dep) => {
      try {
        cache[dep] = { latest: await FETCH_LATEST[dep](), checkedAt: new Date().toISOString() };
      } catch (err) {
        log.warn(
          `Couldn't look up the newest ${dep} version`,
          err instanceof Error ? err.message : err,
        );
      }
    }),
  );
  fs.writeFileSync(cachePath(), JSON.stringify(cache, null, 2));
  return cache;
}

/**
 * Adds newest-version info. Versions compare at the installed precision: Blender folders say "4.2",
 * so "4.2" vs newest "5.2.2" compares 4.2 with 5.2.
 * @param found - What the check found.
 * @param latest - Newest release, or null.
 * @param name - Program name for the message.
 */
export function withLatest(
  found: FoundStatus,
  latest: string | null,
  name: string,
  checkedAt: string | null = null,
): DepStatus {
  const installed = found.version;
  const comparable =
    installed && latest ? latest.split(".").slice(0, installed.split(".").length).join(".") : null;
  const updateAvailable =
    found.state === "ok" &&
    !!installed &&
    !!comparable &&
    compareVersions(installed, comparable) < 0;
  let message = found.message;
  if (updateAvailable)
    message = `${name} ${installed} is installed; ${latest} is the newest version.`;
  return { ...found, latestVersion: latest, latestCheckedAt: checkedAt, updateAvailable, message };
}

/**
 * Looks for Blender and ComfyUI: checks the configured paths still exist, auto-detects and saves
 * installs in their default locations when nothing is configured, flags Blender versions that are
 * too old to work, and compares installed versions with the newest official releases
 * (looked up on the schedule in Settings → General, or right away with `forceUpdateCheck`).
 */
/**
 * Saves each program's detected version into Settings (Blender / ComfyUI → detectedVersion),
 * only when it changed, so the settings file always says what's installed.
 * @param blender - Blender check result.
 * @param comfy - ComfyUI check result.
 */
function rememberVersions(blender: FoundStatus, comfy: FoundStatus): void {
  const saved = getSettings();
  const blenderVersion =
    blender.state === "moved" || blender.state === "missing" ? "" : (blender.version ?? "");
  const comfyVer = comfy.state === "ok" ? (comfy.version ?? "") : "";
  if (
    saved.blender.detectedVersion !== blenderVersion ||
    saved.comfy.detectedVersion !== comfyVer
  ) {
    updateSettings({
      blender: { detectedVersion: blenderVersion },
      comfy: { detectedVersion: comfyVer },
    });
  }
}

export async function checkSetup(
  options: { forceUpdateCheck?: boolean } = {},
): Promise<SetupStatus> {
  const [blender, latest] = await Promise.all([
    checkBlender(),
    latestVersions(options.forceUpdateCheck ?? false),
  ]);
  const comfy = checkComfy();
  rememberVersions(blender, comfy);
  return {
    blender: withLatest(blender, latest.blender.latest, "Blender", latest.blender.checkedAt),
    comfy: withLatest(comfy, latest.comfy.latest, "ComfyUI", latest.comfy.checkedAt),
  };
}
