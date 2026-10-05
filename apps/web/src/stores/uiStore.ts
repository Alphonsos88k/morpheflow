import { create } from "zustand";

interface UiStore {
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  /** Step list collapsed to markers only (remembered in this browser). */
  railCollapsed: boolean;
  toggleRail: () => void;
}

const RAIL_KEY = "morpheflow.railCollapsed";

/** Reads the remembered rail state; storage can be unavailable (private windows), so fail soft. */
function readRailCollapsed(): boolean {
  try {
    return localStorage.getItem(RAIL_KEY) === "1";
  } catch {
    return false;
  }
}

export const useUiStore = create<UiStore>((set) => ({
  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  railCollapsed: readRailCollapsed(),
  toggleRail: () =>
    set((s) => {
      const railCollapsed = !s.railCollapsed;
      try {
        localStorage.setItem(RAIL_KEY, railCollapsed ? "1" : "0");
      } catch {
        // Not remembered; still works for this visit.
      }
      return { railCollapsed };
    }),
}));
