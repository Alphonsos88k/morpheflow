import { useEffect, useRef } from "react";
import { matchesCombo } from "../../hooks/useKeybind.ts";
import type { Command } from "./useCommands.ts";

/** True when focus is in a text box, where plain/Alt shortcuts must not steal keys. */
const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * One global keydown listener that runs the command bound to the pressed combo.
 * Ctrl-combos work everywhere; other combos are ignored while typing (unless `inInputs` is set).
 * @param commands - From useCommands().
 * @param enabled - Off while a modal handles its own keys (e.g. the palette).
 */
export function useCommandKeybinds(commands: Command[], enabled = true): void {
  // Latest commands without re-adding the listener every render.
  const ref = useRef(commands);
  useEffect(() => {
    ref.current = commands;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const command = ref.current.find((c) => c.combo && matchesCombo(e, c.combo));
      if (!command?.combo) return;
      const allowInInputs = command.inInputs ?? command.combo.startsWith("ctrl+");
      if (!allowInInputs && isTyping(e.target)) return;
      if (!enabled && command.id !== "palette" && command.id !== "settings") return;
      e.preventDefault();
      command.run();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
