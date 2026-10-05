import { useEffect, useState } from "react";
import { KEYBINDS, keyLabel } from "../../constants/keybinds.ts";
import { timeAgo } from "../../lib/time.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";

/** Re-render every few seconds so "saved 5 seconds ago" stays current. */
const TICK_MS = 5000;

/**
 * Top-bar status: save state ("Unsaved ●" / "Saved 1 minute ago") and the session's estimated AI cost.
 * Cost is an estimate from token counts × known prices; calls with no known price show tokens only.
 */
export function SessionIndicator() {
  const { dirty, saving, lastSavedAt, session } = useSessionStore();
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const tokens = session.usage.reduce((sum, u) => sum + u.inputTokens + u.outputTokens, 0);
  const priced = session.usage.filter((u) => u.cost !== null);
  const cost = priced.reduce((sum, u) => sum + (u.cost ?? 0), 0);
  const saveText = saving
    ? "Saving…"
    : dirty
      ? "Unsaved ●"
      : lastSavedAt
        ? `Saved ${timeAgo(lastSavedAt)}`
        : "";

  return (
    <div className="flex items-center gap-4 text-xs text-muted">
      {tokens > 0 && (
        <span title="Estimated from token counts × list prices; your real bill may differ.">
          {priced.length > 0 && `≈$${cost.toFixed(cost < 1 ? 3 : 2)} · `}
          {(tokens / 1000).toFixed(1)}k tok
        </span>
      )}
      {saveText && (
        <span
          className={dirty ? "text-warn/80" : ""}
          title={`Save now: ${keyLabel(KEYBINDS.saveSession)}`}
        >
          {saveText}
        </span>
      )}
    </div>
  );
}
