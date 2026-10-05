import { KEYBINDS, keyLabel } from "../../constants/keybinds.ts";
import { Kbd } from "../ui/index.ts";
import { useUiStore } from "../../stores/uiStore.ts";
import { SessionIndicator } from "./SessionIndicator.tsx";

/** App header: name, save/cost status, command palette and settings buttons. Service status sits below (StatusBar). */
export function TopBar() {
  const { setSettingsOpen, setPaletteOpen } = useUiStore();
  const settingsKey = keyLabel(KEYBINDS.toggleSettings);
  const paletteKey = keyLabel(KEYBINDS.commandPalette);

  return (
    <header className="flex h-12 items-center justify-between border-b border-line px-5">
      <span className="font-mono text-sm tracking-tight">
        morphe<span className="text-accent">Flow</span>
      </span>
      <div className="flex items-center gap-5">
        <SessionIndicator />
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-2 text-sm text-muted hover:text-fg"
          title={`Commands (${paletteKey})`}
        >
          Commands <Kbd>{paletteKey}</Kbd>
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          className="flex items-center gap-2 text-muted hover:text-fg"
          aria-label="Settings"
          title={`Settings (${settingsKey})`}
        >
          <span className="text-lg leading-none">⚙</span>
          <Kbd>{settingsKey}</Kbd>
        </button>
      </div>
    </header>
  );
}
