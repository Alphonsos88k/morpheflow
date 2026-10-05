import type { CSSProperties } from "react";
import {
  BACKGROUND_PATTERNS,
  customBackgroundStyle,
  type BackgroundPattern,
} from "../../constants/patterns.ts";
import { useSettingsStore } from "../../stores/settingsStore.ts";

/**
 * Large, angled, faded pattern behind the main area (Settings → General → Background).
 * A custom background file, when set, overrides the chosen pattern.
 * Sits still while the content scrolls over it; purely decorative (no clicks, hidden from screen readers).
 */
export function Backdrop() {
  const app = useSettingsStore((s) => s.settings?.app);
  const style = backdropStyle(app?.backgroundPattern ?? "voxels", app?.customBackground ?? "");
  if (!style) return null;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute" style={style} />
    </div>
  );
}

/**
 * The custom file's look when one is set, otherwise the chosen pattern's; null for "None".
 * @param pattern - Settings → General → Background.
 * @param custom - Settings → General → Custom background path, or "".
 */
function backdropStyle(pattern: BackgroundPattern, custom: string): CSSProperties | null {
  if (custom) return customBackgroundStyle(custom);
  if (pattern === "none") return null;
  return BACKGROUND_PATTERNS[pattern].style;
}
