import fs from "node:fs";
import path from "node:path";
import { BACKGROUND_TYPES } from "../constants/files.ts";
import { AppError } from "../lib/errors.ts";
import { fromRoot } from "../lib/paths.ts";
import { getSettings } from "./settingsStore.ts";

/**
 * Reads the custom background image chosen in Settings → General, so the browser can show it
 * (a web page can't read files from disk by path itself). Only image types are ever sent.
 * @returns The file bytes and its content type.
 * @throws AppError when none is set, the type isn't allowed, or the file is gone.
 */
export function readCustomBackground(): { body: Buffer; type: string } {
  const chosen = getSettings().app.customBackground;
  if (!chosen) throw new AppError("No custom background is set.", 404);
  const file = fromRoot(chosen);
  const type = BACKGROUND_TYPES[path.extname(file).toLowerCase()];
  if (!type) throw new AppError("Custom background must be an .svg, .png, .jpg, or .webp file.");
  if (!fs.existsSync(file)) throw new AppError(`Custom background not found: ${file}`, 404);
  return { body: fs.readFileSync(file), type };
}
