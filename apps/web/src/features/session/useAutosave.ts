import { useEffect } from "react";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { useSettingsStore } from "../../stores/settingsStore.ts";

/**
 * Saves the session every `autosaveSeconds` while it has unsaved changes, when Settings → General
 * → Save mode is "auto" or "both" (designs.md §5.2). Ctrl+S works in every mode.
 * Also saves when the tab is being closed.
 */
export function useAutosave(): void {
  const app = useSettingsStore((s) => s.settings?.app);
  const mode = app?.saveMode ?? "both";
  const seconds = app?.autosaveSeconds ?? 10;

  useEffect(() => {
    if (mode === "manual") return;
    const timer = setInterval(() => {
      const { dirty, save } = useSessionStore.getState();
      if (dirty) void save();
    }, seconds * 1000);
    return () => clearInterval(timer);
  }, [mode, seconds]);

  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden" && useSessionStore.getState().dirty)
        void useSessionStore.getState().save();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);
}
