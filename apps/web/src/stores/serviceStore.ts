import { create } from "zustand";
import type { HealthResponse } from "@morpheflow/spec";
import { api } from "../lib/api.ts";
import { useModelStore } from "./modelStore.ts";

const POLL_MS = 4000;

const UNKNOWN_HEALTH: HealthResponse = {
  comfy: "unknown",
  blender: "unknown",
  llm: "unknown",
  llmModel: null,
  models: { refreshing: false, finishedAt: null, counts: {}, skipped: [], errors: [] },
};

interface ServiceStore {
  health: HealthResponse;
  /** Fetches service status now (e.g. right after clicking Launch). */
  refresh: () => Promise<void>;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  health: UNKNOWN_HEALTH,
  refresh: async () => {
    try {
      const health = await api.get<HealthResponse>("/health");
      set({ health });
      useModelStore.getState().sync(health.models);
    } catch {
      set({ health: UNKNOWN_HEALTH });
    }
  },
}));

/** Loads model lists and starts polling service status. Call once at app start; returns a stop function. */
export function startServicePolling(): () => void {
  void useModelStore.getState().load();
  const { refresh } = useServiceStore.getState();
  void refresh();
  const timer = setInterval(() => void refresh(), POLL_MS);
  return () => clearInterval(timer);
}
