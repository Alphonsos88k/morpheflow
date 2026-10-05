import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repo root, no matter which folder the server was started from. */
export const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

/**
 * Turns a settings path (relative to the repo root, or absolute) into an absolute path.
 * @param p - Path as written in settings.
 */
export function fromRoot(p: string): string {
  return path.isAbsolute(p) ? p : path.join(ROOT_DIR, p);
}
