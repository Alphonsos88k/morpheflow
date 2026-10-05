import { generateText } from "ai";
import type { z } from "zod";
import type { LlmTask, UsageEntry } from "@morpheflow/spec";
import type { SystemPromptName } from "../constants/systemPrompts.ts";
import { AppError } from "../lib/errors.ts";
import { recordUsage } from "./cost.ts";
import { modelForTask } from "./llm.ts";
import { getSettings } from "./settingsStore.ts";
import { loadSystemPrompt } from "./systemPrompts.ts";

/**
 * Pulls the JSON object out of a model reply, tolerating ```json fences and text around it.
 * @param text - Raw model reply.
 * @returns Parsed value.
 * @throws SyntaxError when no JSON object can be parsed.
 */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1];
  const source = fenced ?? text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start === -1 || end < start) throw new SyntaxError("Reply contains no JSON object.");
  return JSON.parse(source.slice(start, end + 1));
}

export interface GenerateJsonOptions<S extends z.ZodType> {
  /** Which job's model to use (Settings → AI models). */
  task: LlmTask;
  /** system_prompts/<prompt>.md holds the instructions. */
  prompt: SystemPromptName;
  /** Values for the prompt's {{placeholders}}. */
  vars: Record<string, string>;
  /** Shape the reply must match (see spec/schemas/aiOutputs.ts). */
  schema: S;
}

/**
 * Asks the model for JSON following a system prompt, validates it, and retries once with the
 * validation error if the first reply is malformed.
 * @returns The validated data and token usage for both attempts.
 * @throws AppError if the second reply is still invalid.
 */
export async function generateJson<S extends z.ZodType>(
  options: GenerateJsonOptions<S>,
): Promise<{ data: z.infer<S>; usage: UsageEntry[] }> {
  const choice = getSettings().llm.tasks[options.task];
  if (!choice) throw new AppError(`No model configured for task "${options.task}".`);
  const model = modelForTask(options.task);
  const prompt = loadSystemPrompt(options.prompt, options.vars);
  const usage: UsageEntry[] = [];

  let problem = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const retryNote = problem
      ? `\n\nYour previous reply was invalid (${problem}). Reply again with valid JSON only.`
      : "";
    const result = await generateText({ model, prompt: prompt + retryNote });
    usage.push(recordUsage(options.task, choice.provider, choice.model, result.totalUsage));
    try {
      const parsed = options.schema.safeParse(extractJson(result.text));
      if (parsed.success) return { data: parsed.data, usage };
      problem = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    } catch (err) {
      problem = err instanceof Error ? err.message : String(err);
    }
  }
  throw new AppError(
    `The AI's reply for "${options.prompt}" wasn't valid after a retry: ${problem}`,
    502,
  );
}
