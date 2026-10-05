import { create } from "zustand";
import type { SetupDep, SetupStatus } from "@morpheflow/spec";
import { toast } from "../components/ui/toastStore.ts";
import { api, messageOf } from "../lib/api.ts";

/** Re-check this often so a program that disappears (moved/uninstalled) is noticed. */
const RECHECK_MS = 60_000;

interface SetupStore {
  status: SetupStatus | null;
  /** "Not now": hidden until the page is reloaded. */
  snoozed: SetupDep[];
  /** Asks the server to look for Blender and ComfyUI. */
  check: () => Promise<void>;
  /** "Check now": looks up the newest versions right away, ignoring the schedule. */
  checkUpdates: () => Promise<void>;
  checkingUpdates: boolean;
  snooze: (dep: SetupDep) => void;
  /** Clears "Not now" so cards show again (used by the "Check setup" command). */
  unsnoozeAll: () => void;
}

export const useSetupStore = create<SetupStore>((set) => ({
  status: null,
  snoozed: [],
  check: async () => {
    try {
      set({ status: await api.get<SetupStatus>("/system/setup") });
    } catch {
      // Server unreachable; the service watcher already says so.
    }
  },
  checkingUpdates: false,
  checkUpdates: async () => {
    set({ checkingUpdates: true });
    try {
      set({ status: await api.post<SetupStatus>("/system/setup/check-updates") });
    } catch (err) {
      toast({ kind: "error", message: `Couldn't check for updates: ${messageOf(err)}` });
    } finally {
      set({ checkingUpdates: false });
    }
  },
  snooze: (dep) => set((s) => ({ snoozed: [...s.snoozed, dep] })),
  unsnoozeAll: () => set({ snoozed: [] }),
}));

/** Checks setup now and every minute. Call once at app start; returns a stop function. */
export function startSetupChecks(): () => void {
  void useSetupStore.getState().check();
  const timer = setInterval(() => void useSetupStore.getState().check(), RECHECK_MS);
  return () => clearInterval(timer);
}
