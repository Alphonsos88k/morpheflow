import path from "node:path";

/** Launch scripts looked for (in order) inside a portable ComfyUI folder. */
export const PORTABLE_LAUNCH_SCRIPTS = ["run_nvidia_gpu.bat", "run_cpu.bat"] as const;

/** Where the ComfyUI Desktop app usually installs itself on Windows. */
export const DESKTOP_EXE_CANDIDATES = [
  path.join(process.env.LOCALAPPDATA ?? "", "Programs", "@comfyorgcomfyui-electron", "ComfyUI.exe"),
  path.join(process.env.LOCALAPPDATA ?? "", "Programs", "ComfyUI", "ComfyUI.exe"),
] as const;
