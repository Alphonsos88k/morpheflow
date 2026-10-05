import fs from "node:fs";
import path from "node:path";
import { SYSTEM_PROMPTS_DIR, type SystemPromptName } from "../constants/systemPrompts.ts";
import { AppError } from "../lib/errors.ts";
import { fromRoot } from "../lib/paths.ts";

/**
 * Fills `{{name}}` placeholders and strips `<!-- notes -->`.
 * @param template - Raw prompt file text.
 * @param vars - Values for every placeholder in the template.
 * @throws AppError if a placeholder has no value (catches typos early).
 */
export function fillTemplate(template: string, vars: Record<string, string> = {}): string {
  return template
    .replace(/<!--[\s\S]*?-->\s*/g, "")
    .replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
      const value = vars[key];
      if (value === undefined)
        throw new AppError(`System prompt is missing a value for {{${key}}}.`, 500);
      return value;
    })
    .trim();
}

/**
 * Reads a stage's instructions from `system_prompts/<name>.md`, fresh on every call,
 * so edits apply without restarting the server.
 * @param name - Which stage's prompt.
 * @param vars - Values for its `{{placeholders}}`.
 */
export function loadSystemPrompt(name: SystemPromptName, vars?: Record<string, string>): string {
  const file = path.join(fromRoot(SYSTEM_PROMPTS_DIR), `${name}.md`);
  if (!fs.existsSync(file))
    throw new AppError(`System prompt file not found: ${SYSTEM_PROMPTS_DIR}/${name}.md`, 500);
  return fillTemplate(fs.readFileSync(file, "utf8"), vars);
}
