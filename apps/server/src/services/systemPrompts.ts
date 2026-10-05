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

/** Reads `system_prompts/<name>.md`, or throws a clear error naming the missing file. */
function readPromptFile(name: string): string {
  const file = path.join(fromRoot(SYSTEM_PROMPTS_DIR), `${name}.md`);
  if (!fs.existsSync(file))
    throw new AppError(`System prompt file not found: ${SYSTEM_PROMPTS_DIR}/${name}.md`, 500);
  return fs.readFileSync(file, "utf8");
}

/**
 * Replaces `{{> name}}` with the text of `system_prompts/<name>.md`, so shared parts
 * (e.g. the looks list in styles.md) live in one file. One level deep; names are word characters only.
 * @param template - Raw prompt file text.
 */
export function expandIncludes(template: string): string {
  return template.replace(/\{\{>\s*(\w+)\s*\}\}/g, (_, name: string) => readPromptFile(name).trim());
}

/**
 * Reads a stage's instructions from `system_prompts/<name>.md`, fresh on every call,
 * so edits apply without restarting the server.
 * @param name - Which stage's prompt.
 * @param vars - Values for its `{{placeholders}}`.
 */
export function loadSystemPrompt(name: SystemPromptName, vars?: Record<string, string>): string {
  return fillTemplate(expandIncludes(readPromptFile(name)), vars);
}
