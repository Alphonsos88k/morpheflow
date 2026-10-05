import fs from "node:fs";
import path from "node:path";
import { SessionSchema, type Session, type SessionSummary } from "@morpheflow/spec";
import { SESSION_FILE } from "../constants/files.ts";
import { AppError } from "../lib/errors.ts";
import { fromRoot } from "../lib/paths.ts";
import { getSettings } from "./settingsStore.ts";

/** Session IDs are UUIDs; anything else is rejected so IDs can't escape the outputs folder. */
const SAFE_ID = /^[a-zA-Z0-9-]{8,64}$/;

/**
 * Folder for one session's files (session.json, images, .blend versions), created if missing.
 * @param id - Session ID.
 * @throws AppError for IDs that aren't safe folder names.
 */
export function sessionDir(id: string): string {
  if (!SAFE_ID.test(id)) throw new AppError("Invalid session ID.");
  const dir = path.join(fromRoot(getSettings().app.outputsDir), id);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Validates and writes a session to `outputs/<id>/session.json`.
 * @param session - Full session from the browser.
 * @returns The saved session with a fresh `updatedAt`.
 */
export function saveSession(session: unknown): Session {
  const parsed = SessionSchema.parse(session);
  const saved = { ...parsed, updatedAt: new Date().toISOString() };
  fs.writeFileSync(path.join(sessionDir(saved.id), SESSION_FILE), JSON.stringify(saved, null, 2));
  return saved;
}

/**
 * Reads one saved session.
 * @param id - Session ID.
 */
export function loadSession(id: string): Session {
  const file = path.join(sessionDir(id), SESSION_FILE);
  if (!fs.existsSync(file)) throw new AppError("Session not found.", 404);
  return SessionSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
}

/** All saved sessions, newest first. Unreadable session files are skipped. */
export function listSessions(): SessionSummary[] {
  const root = fromRoot(getSettings().app.outputsDir);
  if (!fs.existsSync(root)) return [];
  const summaries: SessionSummary[] = [];
  for (const id of fs.readdirSync(root)) {
    try {
      const s = loadSession(id);
      summaries.push({ id: s.id, prompt: s.scene.prompt, updatedAt: s.updatedAt });
    } catch {
      // Not a session folder, or an old/broken file.
    }
  }
  return summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
