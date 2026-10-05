import { useEffect, useRef } from "react";

/**
 * Checks a keyboard event against a combo like "ctrl+,", "alt+2", or "escape".
 * @param e - The keydown event.
 * @param combo - Lowercase keys joined by "+"; the last part is the key itself.
 */
export function matchesCombo(e: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split("+");
  const key = parts.pop();
  const mods = new Set(parts);
  return (
    e.key.toLowerCase() === key &&
    e.ctrlKey === mods.has("ctrl") &&
    e.altKey === mods.has("alt") &&
    e.shiftKey === mods.has("shift")
  );
}

/**
 * Runs `handler` when the key combo is pressed anywhere on the page.
 * @param combo - e.g. "ctrl+," (see `matchesCombo`).
 * @param handler - Called with the event; the browser default is prevented.
 * @param enabled - Turn the binding off without unmounting. Defaults to true.
 */
export function useKeybind(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  enabled = true,
): void {
  // Keep the latest handler without re-registering the listener every render.
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (!matchesCombo(e, combo)) return;
      e.preventDefault();
      handlerRef.current(e);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [combo, enabled]);
}
