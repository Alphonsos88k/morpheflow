import type { HealthResponse, ServiceState } from "@morpheflow/spec";
import { toast } from "../../components/ui/toastStore.ts";
import { SERVICE_NAMES, launchService, type LaunchableService } from "../../lib/services.ts";
import { useServiceStore } from "../../stores/serviceStore.ts";

const isUp = (s: ServiceState) => s === "up";

/**
 * Announces service changes as they happen: "ComfyUI connected", "Blender disconnected" (with
 * Launch / Retry), and when our own server stops answering. The first status check after page load
 * is silent. Call once at app start; returns an unsubscribe function.
 */
export function watchServices(): () => void {
  let seenFirst = false;
  return useServiceStore.subscribe(({ health }, { health: prev }) => {
    const serverDown = health.comfy === "unknown" && health.blender === "unknown";
    const serverWasDown = prev.comfy === "unknown" && prev.blender === "unknown";
    if (!seenFirst) {
      seenFirst = !serverDown;
      return;
    }
    if (serverDown && !serverWasDown) {
      toast({
        kind: "error",
        message: "Lost contact with the morpheFlow server. Is its window still open?",
      });
      return;
    }
    if (serverWasDown && !serverDown)
      toast({ kind: "success", message: "Reconnected to the morpheFlow server." });
    for (const service of ["comfy", "blender"] as const) announce(service, prev, health);
  });
}

/**
 * Toasts one service's up/down transition.
 * @param service - Which service.
 * @param prev - Previous health.
 * @param next - New health.
 */
function announce(service: LaunchableService, prev: HealthResponse, next: HealthResponse): void {
  const name = SERVICE_NAMES[service];
  if (!isUp(prev[service]) && isUp(next[service])) {
    toast({ kind: "success", message: `${name} connected.` });
  } else if (isUp(prev[service]) && next[service] === "down") {
    toast({
      kind: "error",
      message: `${name} disconnected.`,
      actions: [
        { label: "Launch", onClick: () => void launchService(service) },
        { label: "Retry", onClick: () => void useServiceStore.getState().refresh() },
      ],
    });
  }
}
