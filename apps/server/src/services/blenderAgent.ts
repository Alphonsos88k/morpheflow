import { generateText, isStepCount } from "ai";
import type { AgentStep, BlenderRunResponse } from "@morpheflow/spec";
import { AppError } from "../lib/errors.ts";
import { blenderStatus } from "./blender.ts";
import { loadRecipes, saveBlendVersion, withMcpClient } from "./blenderMcp.ts";
import { recordUsage } from "./cost.ts";
import { modelForTask } from "./llm.ts";
import { sessionDir } from "./sessions.ts";
import { getSettings } from "./settingsStore.ts";
import { loadSystemPrompt } from "./systemPrompts.ts";

/** Longest tool-input preview shown in the live log. */
const SUMMARY_LENGTH = 120;

/**
 * Runs the Blender agent: saves a .blend backup, then lets the LLM call blender-mcp tools
 * until it's done or hits the step budget.
 * @param prompt - What the user wants built.
 * @param sessionId - Session whose folder gets the backup.
 * @returns The tool calls made (for the log), the agent's final message, token usage, and the backup path.
 */
export async function runBlenderAgent(
  prompt: string,
  sessionId: string,
): Promise<BlenderRunResponse> {
  if ((await blenderStatus()) !== "up")
    throw new AppError("Blender isn't running or the MCP addon isn't started.", 503);
  const choice = getSettings().llm.tasks.blenderAgent;
  if (!choice) throw new AppError("No model configured for the Blender agent.");
  const model = modelForTask("blenderAgent");

  const blendVersion = await saveBlendVersion(sessionDir(sessionId));
  await loadRecipes();

  const result = await withMcpClient(async (client) =>
    generateText({
      model,
      system: loadSystemPrompt("blender_agent"),
      prompt,
      tools: await client.tools(),
      stopWhen: isStepCount(getSettings().blender.stepBudget),
    }),
  );

  const steps: AgentStep[] = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => ({
      tool: call.toolName,
      summary: JSON.stringify(call.input).slice(0, SUMMARY_LENGTH),
    })),
  );
  const usage = recordUsage("blenderAgent", choice.provider, choice.model, result.totalUsage);
  return { steps, finalText: result.text, usage, blendVersion };
}
