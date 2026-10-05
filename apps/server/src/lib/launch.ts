import { spawn } from "node:child_process";

/**
 * Starts an outside program (ComfyUI, Blender) that keeps running after our server stops.
 * @param command - Executable path, or a full shell command when `args` is empty.
 * @param args - Arguments; when given, `command` runs directly without a shell.
 * @param cwd - Working directory; defaults to the server's.
 */
export function launchDetached(command: string, args: string[] = [], cwd?: string): void {
  const child = spawn(command, args, {
    cwd: cwd || undefined,
    shell: args.length === 0,
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}
