/**
 * Every app-wide shortcut in one place (designs.md §5.4). Format: see `matchesCombo`.
 * Commands (features/commands) bind these; components only show them via `keyLabel`.
 */
export const KEYBINDS = {
  commandPalette: "ctrl+k",
  toggleSettings: "ctrl+,",
  saveSettings: "ctrl+enter",
  saveAndCloseSettings: "ctrl+shift+enter",
  saveSession: "ctrl+s",
  prevStep: "alt+arrowleft",
  nextStep: "alt+arrowright",
  toggleComfy: "alt+c",
  toggleRail: "ctrl+b",
} as const;

/** Alt+1 … Alt+9 jump to step 1 … 9. */
export const goToStepCombo = (index: number) => `alt+${index + 1}`;

const KEY_NAMES: Record<string, string> = {
  arrowleft: "←",
  arrowright: "→",
  arrowup: "↑",
  arrowdown: "↓",
};

/**
 * Turns "ctrl+enter" into "Ctrl+Enter" and "alt+arrowleft" into "Alt+←" for key hints.
 * @param combo - A combo from `KEYBINDS`.
 */
export const keyLabel = (combo: string) =>
  combo
    .split("+")
    .map((k) => KEY_NAMES[k] ?? k.charAt(0).toUpperCase() + k.slice(1))
    .join("+");
