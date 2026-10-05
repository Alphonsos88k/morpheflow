import { create } from "zustand";
import type { PublicSettings, SettingsPatch } from "@morpheflow/spec";
import { toast } from "../components/ui/toastStore.ts";
import { api, messageOf } from "../lib/api.ts";

interface SettingsStore {
  /** Saved settings (no API keys); null until loaded. */
  settings: PublicSettings | null;
  saving: boolean;
  /** Loads settings from the server (app start, and whenever Settings opens). */
  load: () => Promise<void>;
  /**
   * Saves changed fields. Empty API key fields keep the saved key.
   * @returns true on success.
   */
  save: (patch: SettingsPatch) => Promise<boolean>;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  saving: false,
  load: async () => {
    try {
      set({ settings: await api.get<PublicSettings>("/settings") });
    } catch (err) {
      toast({ kind: "error", message: `Couldn't load settings: ${messageOf(err)}` });
    }
  },
  save: async (patch) => {
    set({ saving: true });
    try {
      set({ settings: await api.put<PublicSettings>("/settings", patch) });
      toast({ kind: "success", message: "Settings saved." });
      return true;
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
      return false;
    } finally {
      set({ saving: false });
    }
  },
}));
