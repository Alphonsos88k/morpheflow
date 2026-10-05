import fs from "node:fs";
import path from "node:path";

/** Folders where user-level tools often install without being added to PATH (Windows). */
function extraToolDirs(): string[] {
  const dirs: string[] = [];
  const home = process.env.USERPROFILE ?? "";
  if (home) dirs.push(path.join(home, ".local", "bin"), path.join(home, ".cargo", "bin"));
  const pythonRoot = path.join(process.env.APPDATA ?? "", "Python");
  if (fs.existsSync(pythonRoot)) {
    for (const version of fs.readdirSync(pythonRoot))
      dirs.push(path.join(pythonRoot, version, "Scripts"));
  }
  return dirs;
}

/**
 * Resolves a bare command name (e.g. "uvx") to a full path, looking in PATH and then in common
 * user-install folders that aren't always on PATH (pip --user Scripts, ~/.local/bin).
 * Paths and commands that can't be found are returned unchanged.
 * @param command - Command name or path from settings.
 */
export function findExecutable(command: string): string {
  if (path.isAbsolute(command) || command.includes("/") || command.includes("\\")) return command;
  const exts = process.platform === "win32" ? ["", ".exe", ".cmd", ".bat"] : [""];
  const pathDirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const dir of [...pathDirs, ...extraToolDirs()]) {
    for (const ext of exts) {
      const candidate = path.join(dir, command + ext);
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return command;
}
