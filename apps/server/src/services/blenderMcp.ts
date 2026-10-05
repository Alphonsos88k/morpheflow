import fs from "node:fs";
import path from "node:path";
import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";
import { AppError, errorMessage } from "../lib/errors.ts";
import { findExecutable } from "../lib/findExecutable.ts";
import { log } from "../lib/logger.ts";
import { fromRoot } from "../lib/paths.ts";
import { getSettings, onSettingsChange } from "./settingsStore.ts";

/** blender-mcp's tool that runs Python inside Blender. */
export const EXECUTE_CODE_TOOL = "execute_blender_code";

let client: MCPClient | null = null;

/** Connected MCP client for blender-mcp; started on first use and reused after. */
export async function getMcpClient(): Promise<MCPClient> {
  if (client) return client;
  const { mcpCommand, mcpArgs, host, port } = getSettings().blender;
  try {
    client = await createMCPClient({
      transport: new Experimental_StdioMCPTransport({
        command: findExecutable(mcpCommand),
        args: mcpArgs,
        env: { ...process.env, BLENDER_HOST: host, BLENDER_PORT: String(port) } as Record<
          string,
          string
        >,
      }),
    });
    return client;
  } catch (err) {
    throw new AppError(
      `Couldn't start the Blender MCP server ("${mcpCommand} ${mcpArgs.join(" ")}"). ` +
        `Is it installed? (default needs "uv": https://docs.astral.sh/uv/). Details: ${errorMessage(err)}`,
      503,
    );
  }
}

/** Closes the MCP connection; the next call reconnects with current settings. */
export async function resetMcpClient(): Promise<void> {
  const old = client;
  client = null;
  await old?.close().catch(() => undefined);
}

onSettingsChange(() => void resetMcpClient());

/**
 * Runs `fn` with the MCP client. If the connection has dropped (blender-mcp exited, pipe closed),
 * reconnects once and retries, so a restarted Blender/MCP server recovers without user action.
 * @param fn - Work that needs the client.
 */
export async function withMcpClient<T>(fn: (client: MCPClient) => Promise<T>): Promise<T> {
  try {
    return await fn(await getMcpClient());
  } catch (err) {
    if (!/closed|not connected|EPIPE|ECONNRESET|terminated/i.test(errorMessage(err))) throw err;
    log.warn("Blender MCP connection lost; reconnecting once.", errorMessage(err));
    await resetMcpClient();
    return fn(await getMcpClient());
  }
}

/** Names of the tools blender-mcp offers. */
export async function listBlenderTools(): Promise<string[]> {
  const { tools } = await withMcpClient((client) => client.listTools());
  return tools.map((t) => t.name);
}

/**
 * Runs Python inside Blender through blender-mcp.
 * @param code - Python source; `bpy` is available.
 * @throws AppError when Blender reports an error.
 */
export async function runBlenderCode(code: string): Promise<void> {
  const result = await withMcpClient((client) =>
    client.callTool({ name: EXECUTE_CODE_TOOL, arguments: { code } }),
  );
  if (result.isError) {
    const parts = Array.isArray(result.content) ? (result.content as { text?: unknown }[]) : [];
    const text = parts.map((c) => (typeof c.text === "string" ? c.text : "")).join(" ");
    throw new AppError(`Blender reported an error: ${text.slice(0, 300)}`, 502);
  }
}

/**
 * Makes our recipe package importable inside Blender (`from morphe_recipes import ...`).
 * Safe to call repeatedly; it also reloads recipes so edits apply without restarting Blender.
 */
export async function loadRecipes(): Promise<void> {
  const dir = fromRoot(getSettings().blender.recipesDir).replaceAll("\\", "/");
  await runBlenderCode(
    [
      "import sys, importlib",
      `p = r"${dir}"`,
      "if p not in sys.path: sys.path.insert(0, p)",
      "import morphe_recipes",
      "importlib.reload(morphe_recipes)",
    ].join("\n"),
  );
}

/**
 * Saves a copy of the current Blender scene as the next `v###.blend` in the session folder,
 * so a bad AI change can be undone (designs.md §3.10).
 * @param folder - Session folder (absolute).
 * @returns The saved file's path, or null if Blender couldn't save.
 */
export async function saveBlendVersion(folder: string): Promise<string | null> {
  const existing = fs.readdirSync(folder).filter((f) => /^v\d{3}\.blend$/.test(f)).length;
  const file = path
    .join(folder, `v${String(existing + 1).padStart(3, "0")}.blend`)
    .replaceAll("\\", "/");
  try {
    await runBlenderCode(`import bpy\nbpy.ops.wm.save_as_mainfile(filepath=r"${file}", copy=True)`);
    return file;
  } catch (err) {
    log.warn("Couldn't save .blend version before the AI run.", errorMessage(err));
    return null;
  }
}
