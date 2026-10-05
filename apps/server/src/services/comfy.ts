import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { ComfyGenerateRequest, ServiceState, Settings } from "@morpheflow/spec";
import { DESKTOP_EXE_CANDIDATES, PORTABLE_LAUNCH_SCRIPTS } from "../constants/comfy.ts";
import {
  COMFY_GENERATE_TIMEOUT_MS as GENERATE_TIMEOUT_MS,
  COMFY_POLL_INTERVAL_MS as POLL_INTERVAL_MS,
  COMFY_STARTUP_GRACE_MS as STARTUP_GRACE_MS,
  HEALTH_CHECK_TIMEOUT_MS,
} from "../constants/timeouts.ts";
import { AppError } from "../lib/errors.ts";
import { fetchJson } from "../lib/fetchJson.ts";
import { launchDetached } from "../lib/launch.ts";
import { fromRoot } from "../lib/paths.ts";
import { getSettings } from "./settingsStore.ts";

/** A ComfyUI workflow in API format: node ID → node. */
export type ComfyWorkflow = Record<string, { class_type: string; inputs: Record<string, unknown> }>;

interface ComfyImageRef {
  filename: string;
  subfolder: string;
  type: string;
}

type ComfyHistory = Record<string, { outputs: Record<string, { images?: ComfyImageRef[] }> }>;

let launchedAt = 0;

const baseUrl = () => getSettings().comfy.url.replace(/\/$/, "");

/** Is ComfyUI reachable right now? */
export async function comfyStatus(): Promise<ServiceState> {
  try {
    await fetchJson(`${baseUrl()}/system_stats`, {}, HEALTH_CHECK_TIMEOUT_MS);
    launchedAt = 0;
    return "up";
  } catch {
    return Date.now() - launchedAt < STARTUP_GRACE_MS ? "starting" : "down";
  }
}

/** How to start ComfyUI: a shell command + the folder to run it in. */
interface LaunchPlan {
  command: string;
  cwd: string;
}

/**
 * Works out how to start ComfyUI, in order:
 * 1. the launch command from Settings,
 * 2. a portable install's run_*.bat in the ComfyUI folder,
 * 3. a git install's main.py in the ComfyUI folder,
 * 4. the ComfyUI Desktop app in its default location.
 * @returns The plan, or null if no ComfyUI install was found.
 */
export function findComfyLaunch(): LaunchPlan | null {
  const { launchCommand, workingDir } = getSettings().comfy;
  if (launchCommand) return { command: launchCommand, cwd: workingDir };
  if (workingDir) {
    const script = PORTABLE_LAUNCH_SCRIPTS.find((s) => fs.existsSync(path.join(workingDir, s)));
    if (script) return { command: script, cwd: workingDir };
    if (fs.existsSync(path.join(workingDir, "main.py")))
      return { command: "python main.py", cwd: workingDir };
  }
  const desktop = DESKTOP_EXE_CANDIDATES.find((exe) => fs.existsSync(exe));
  return desktop ? { command: `"${desktop}"`, cwd: path.dirname(desktop) } : null;
}

/** Starts ComfyUI (see `findComfyLaunch`), unless it's already running. */
export async function launchComfy(): Promise<void> {
  if ((await comfyStatus()) !== "down") return; // up, or already starting: never launch twice
  const plan = findComfyLaunch();
  if (!plan) {
    throw new AppError(
      "No ComfyUI install found. Install ComfyUI (portable or Desktop), then set its folder in Settings → ComfyUI.",
    );
  }
  launchDetached(plan.command, [], plan.cwd);
  launchedAt = Date.now();
}

/** Checkpoint to use: the one in Settings, or the first one ComfyUI has installed. */
async function pickCheckpoint(): Promise<string> {
  const configured = getSettings().comfy.checkpoint;
  if (configured) return configured;
  const info = await fetchJson<Record<string, { input: { required: { ckpt_name: [string[]] } } }>>(
    `${baseUrl()}/object_info/CheckpointLoaderSimple`,
  );
  const first = info.CheckpointLoaderSimple?.input.required.ckpt_name[0][0];
  if (!first) throw new AppError("ComfyUI has no checkpoints installed.");
  return first;
}

/**
 * Loads the workflow template and fills in prompts, seed, and checkpoint.
 * @param request - Positive/negative prompt text.
 */
async function buildWorkflow(request: ComfyGenerateRequest): Promise<ComfyWorkflow> {
  const { workflowTemplate, nodeMap } = getSettings().comfy;
  const template = JSON.parse(fs.readFileSync(fromRoot(workflowTemplate), "utf8")) as ComfyWorkflow;
  return fillWorkflow(template, nodeMap, {
    ...request,
    seed: Math.floor(Math.random() * 2 ** 32),
    checkpoint: await pickCheckpoint(),
  });
}

/**
 * Returns a copy of a workflow template with prompts, seed, and checkpoint filled in.
 * @param template - API-format workflow (not modified).
 * @param nodeMap - Which node IDs hold each value (Settings → ComfyUI).
 * @param values - What to put in them.
 * @throws AppError when the template lacks a mapped node.
 */
export function fillWorkflow(
  template: ComfyWorkflow,
  nodeMap: Settings["comfy"]["nodeMap"],
  values: { positive: string; negative: string; seed: number; checkpoint: string },
): ComfyWorkflow {
  const workflow = structuredClone(template);
  const node = (id: string) => {
    const found = workflow[id];
    if (!found)
      throw new AppError(
        `Workflow template has no node "${id}" (check Settings → ComfyUI node map).`,
      );
    return found.inputs;
  };
  node(nodeMap.positive).text = values.positive;
  node(nodeMap.negative).text = values.negative;
  node(nodeMap.sampler).seed = values.seed;
  node(nodeMap.checkpoint).ckpt_name = values.checkpoint;
  return workflow;
}

/**
 * Queues one generation and waits for it to finish.
 * @param request - Positive/negative prompt text.
 * @returns Backend URLs of the generated images.
 */
export async function generateImages(request: ComfyGenerateRequest): Promise<string[]> {
  if ((await comfyStatus()) !== "up") throw new AppError("ComfyUI isn't running.", 503);
  const workflow = await buildWorkflow(request);
  const { prompt_id } = await fetchJson<{ prompt_id: string }>(`${baseUrl()}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: workflow, client_id: randomUUID() }),
  });

  const deadline = Date.now() + GENERATE_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    const history = await fetchJson<ComfyHistory>(`${baseUrl()}/history/${prompt_id}`);
    const entry = history[prompt_id];
    if (!entry) continue;
    const images = Object.values(entry.outputs).flatMap((out) => out.images ?? []);
    return images.map((img) => `/api/comfy/view?${new URLSearchParams({ ...img })}`);
  }
  throw new AppError("ComfyUI took longer than 5 minutes.", 504);
}

/**
 * Fetches one image from ComfyUI so the browser can load it from our origin.
 * @param query - The filename/subfolder/type query string from `generateImages`.
 */
export async function fetchComfyImage(query: string): Promise<Response> {
  return fetch(`${baseUrl()}/view?${query}`);
}
