import fs from "node:fs";
import path from "node:path";
import { LOG_FILE, LOG_MAX_BYTES } from "../constants/files.ts";
import { fromRoot } from "./paths.ts";

type Level = "info" | "warn" | "error";

const logPath = fromRoot(LOG_FILE);
fs.mkdirSync(path.dirname(logPath), { recursive: true });

/** Keeps one previous log file: server.log → server.log.1 once it passes LOG_MAX_BYTES. */
function rotateIfLarge(): void {
  try {
    if (fs.statSync(logPath).size > LOG_MAX_BYTES) fs.renameSync(logPath, `${logPath}.1`);
  } catch {
    // No log file yet.
  }
}

/**
 * Writes one line to the console and to logs/server.log.
 * @param level - Severity.
 * @param message - What happened.
 * @param detail - Optional extra data (errors are reduced to their stack/message).
 */
function write(level: Level, message: string, detail?: unknown): void {
  const extra =
    detail instanceof Error
      ? ` ${detail.stack ?? detail.message}`
      : detail === undefined
        ? ""
        : ` ${JSON.stringify(detail)}`;
  const line = `${new Date().toISOString()} ${level.toUpperCase().padEnd(5)} ${message}${extra}`;
  (level === "info" ? console.log : level === "warn" ? console.warn : console.error)(line);
  rotateIfLarge();
  fs.appendFile(logPath, line + "\n", () => undefined);
}

export const log = {
  info: (message: string, detail?: unknown) => write("info", message, detail),
  warn: (message: string, detail?: unknown) => write("warn", message, detail),
  error: (message: string, detail?: unknown) => write("error", message, detail),
};
