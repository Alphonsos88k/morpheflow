import type { CSSProperties } from "react";
import type { Settings } from "@morpheflow/spec";
import dotsUrl from "../assets/patterns/dots.svg?url";
import floorUrl from "../assets/patterns/floor.svg?url";
import voxelsUrl from "../assets/patterns/voxels.svg?url";

export type BackgroundPattern = Settings["app"]["backgroundPattern"];

/**
 * Decorative backgrounds for the main area (ui_style.md §9). Each is a tiny tiling SVG from
 * `assets/patterns/`, made large, angled, and faded with a mask so it never competes with content.
 * To add one: drop an .svg in assets/patterns, import it here, add it to the setting's enum.
 */
export const BACKGROUND_PATTERNS: Record<
  Exclude<BackgroundPattern, "none">,
  { label: string; style: CSSProperties }
> = {
  voxels: {
    label: "Voxel cubes",
    style: {
      inset: "-30%",
      backgroundImage: `url("${voxelsUrl}")`,
      backgroundSize: "125px 216px", // 3× the tile: large cubes
      transform: "rotate(-14deg)",
      opacity: 0.09,
      maskImage: "radial-gradient(ellipse 60% 55% at 78% 22%, black, transparent 78%)",
    },
  },
  floor: {
    label: "Blender floor grid",
    style: {
      left: "-50%",
      right: "-50%",
      bottom: 0,
      height: "70%",
      backgroundImage: `url("${floorUrl}")`,
      backgroundSize: "96px 96px",
      transform: "perspective(600px) rotateX(64deg)",
      transformOrigin: "50% 100%",
      opacity: 0.14,
      maskImage: "linear-gradient(to top, black 10%, transparent 85%)",
    },
  },
  dots: {
    label: "Dot matrix",
    style: {
      inset: 0,
      backgroundImage: `url("${dotsUrl}")`,
      backgroundSize: "24px 24px",
      opacity: 0.2,
      maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 80%)",
    },
  },
};

/** Labels for the Settings dropdown, including "None". */
export const BACKGROUND_LABELS: Record<BackgroundPattern, string> = {
  voxels: BACKGROUND_PATTERNS.voxels.label,
  floor: BACKGROUND_PATTERNS.floor.label,
  dots: BACKGROUND_PATTERNS.dots.label,
  none: "None",
};

/** Folder the "Custom background" picker opens in (relative to the project). */
export const PATTERNS_FOLDER = "apps/web/src/assets/patterns";

/**
 * Look for a custom background file (Settings → General → Custom background).
 * SVGs tile like the built-in patterns (large, angled, faded); photos/images fill the area, faded.
 * @param file - Path from settings (only used to pick the style and bust the cache).
 */
export function customBackgroundStyle(file: string): CSSProperties {
  const url = `url("/api/system/background?f=${encodeURIComponent(file)}")`;
  if (file.toLowerCase().endsWith(".svg")) {
    return { ...BACKGROUND_PATTERNS.voxels.style, backgroundImage: url, backgroundSize: "auto" };
  }
  return {
    inset: 0,
    backgroundImage: url,
    backgroundSize: "cover",
    backgroundPosition: "center",
    opacity: 0.16,
    maskImage: "radial-gradient(ellipse 75% 70% at 60% 35%, black, transparent 85%)",
  };
}
