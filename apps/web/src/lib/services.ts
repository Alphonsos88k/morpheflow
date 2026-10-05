import { toast, type ToastAction } from "../components/ui/toastStore.ts";
import { useServiceStore } from "../stores/serviceStore.ts";
import { api, messageOf } from "./api.ts";

export type LaunchableService = "comfy" | "blender";

export const SERVICE_NAMES: Record<LaunchableService, string> = {
  comfy: "ComfyUI",
  blender: "Blender",
};

/**
 * Asks the backend to start ComfyUI or Blender, with toasts for progress and errors.
 * The server never starts a second copy if one is running or still starting.
 * @param service - Which program to start.
 */
export async function launchService(service: LaunchableService): Promise<void> {
  try {
    await api.post(`/${service}/launch`);
    toast({
      kind: "info",
      message: `${SERVICE_NAMES[service]} is starting, give it a few moments…`,
    });
  } catch (err) {
    toast({ kind: "error", message: messageOf(err) });
  }
  await useServiceStore.getState().refresh();
}

/**
 * Shows "X isn't running" with Launch, plus any extra actions (e.g. Retry, Skip).
 * @param service - Which program is down.
 * @param detail - Server message to show.
 * @param extra - More buttons after Launch.
 */
export function toastServiceDown(
  service: LaunchableService,
  detail: string,
  extra: ToastAction[] = [],
): void {
  toast({
    kind: "error",
    message: detail || `${SERVICE_NAMES[service]} isn't running.`,
    actions: [{ label: "Launch", onClick: () => void launchService(service) }, ...extra],
  });
}
