import fs from "node:fs";
import net from "node:net";
import type { ServiceState } from "@morpheflow/spec";
import { BLENDER_STARTUP_GRACE_MS as STARTUP_GRACE_MS } from "../constants/timeouts.ts";
import { AppError } from "../lib/errors.ts";
import { launchDetached } from "../lib/launch.ts";
import { fromRoot } from "../lib/paths.ts";
import { getSettings } from "./settingsStore.ts";

let launchedAt = 0;

/** Is the Blender MCP addon listening on its socket? */
export function blenderStatus(): Promise<ServiceState> {
  const { host, port } = getSettings().blender;
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 1000 });
    const finish = (state: ServiceState) => {
      socket.destroy();
      resolve(state);
    };
    socket.once("connect", () => {
      launchedAt = 0;
      finish("up");
    });
    const failed = () => finish(Date.now() - launchedAt < STARTUP_GRACE_MS ? "starting" : "down");
    socket.once("error", failed);
    socket.once("timeout", failed);
  });
}

/** Starts Blender with our startup script (loads recipes, starts the MCP addon server). */
export async function launchBlender(): Promise<void> {
  if ((await blenderStatus()) !== "down") return; // up, or already starting: never launch twice
  const { exePath, startupScript } = getSettings().blender;
  if (!exePath) throw new AppError("Set the path to blender.exe in Settings → Blender first.");
  if (!fs.existsSync(exePath)) throw new AppError(`blender.exe not found at: ${exePath}`);
  launchDetached(exePath, ["--python", fromRoot(startupScript)]);
  launchedAt = Date.now();
}
