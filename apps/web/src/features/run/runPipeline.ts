import type { BlenderRunResponse, ComfyGenerateResponse } from "@morpheflow/spec";
import { toast, type ToastAction } from "../../components/ui/toastStore.ts";
import { api, isServiceDown, messageOf } from "../../lib/api.ts";
import { toastServiceDown, type LaunchableService } from "../../lib/services.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";

const store = () => useSessionStore.getState();

/**
 * Reports a failed part with the right buttons: Launch when its service is down, always Retry,
 * and Skip when the part is optional.
 * @param err - What went wrong.
 * @param service - Service the part talks to.
 * @param retry - Re-runs just this part.
 * @param skip - Turns the step off (optional steps only).
 */
function reportFailure(
  err: unknown,
  service: LaunchableService,
  retry: () => void,
  skip?: () => void,
): void {
  const actions: ToastAction[] = [{ label: "Retry", onClick: retry }];
  if (skip) actions.push({ label: "Skip", onClick: skip });
  if (isServiceDown(err)) toastServiceDown(service, messageOf(err), actions);
  else toast({ kind: "error", message: messageOf(err), actions });
}

/** Generates ComfyUI concept images for the current prompt (step 4). */
export async function runComfyStep(): Promise<void> {
  const { session, setStepStatus, setResults } = store();
  setStepStatus("comfy", "running");
  try {
    const res = await api.post<ComfyGenerateResponse>("/comfy/generate", {
      positive: session.scene.prompt,
    });
    setResults({ comfyImages: res.images });
    setStepStatus("comfy", "done");
  } catch (err) {
    setStepStatus("comfy", "error");
    reportFailure(
      err,
      "comfy",
      () => void runComfyStep(),
      () => store().toggleStep("comfy"),
    );
  }
}

/** Runs the Blender agent on the current prompt (step 7). A .blend backup is saved first. */
export async function runBuildStep(): Promise<void> {
  const { session, setStepStatus, setResults, addUsage } = store();
  setStepStatus("build", "running");
  try {
    const res = await api.post<BlenderRunResponse>("/blender/run", {
      prompt: session.scene.prompt,
      sessionId: session.id,
    });
    const versions = store().session.results.blendVersions;
    setResults({
      buildSteps: res.steps,
      buildText: res.finalText,
      blendVersions: res.blendVersion ? [...versions, res.blendVersion] : versions,
    });
    addUsage([res.usage]);
    setStepStatus("build", "done");
  } catch (err) {
    setStepStatus("build", "error");
    reportFailure(err, "blender", () => void runBuildStep());
  }
}

/**
 * The Stage 2 pipeline from the prompt box: ComfyUI image (if that step is on) and the Blender
 * build run in parallel; the view moves to the Blender build step. Saves the session afterwards.
 */
export async function runPipeline(): Promise<void> {
  const { session, setStepStatus, goTo } = store();
  if (!session.scene.prompt.trim()) return;
  setStepStatus("prompt", "done");
  goTo("build");
  const parts = [runBuildStep()];
  if (session.steps.comfy.enabled) parts.push(runComfyStep());
  await Promise.all(parts);
  await store().save();
}

/** True while any pipeline step is running. */
export const isRunning = (steps = store().session.steps) =>
  Object.values(steps).some((s) => s.status === "running");
