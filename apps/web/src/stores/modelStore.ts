import { create } from "zustand";
import {
  PROVIDER_LABELS,
  type ModelCatalog,
  type ModelRefreshStatus,
  type Provider,
} from "@morpheflow/spec";
import { toast } from "../components/ui/toastStore.ts";
import { api, messageOf } from "../lib/api.ts";

/** Only announce a finished background refresh if it finished this recently (e.g. at app launch). */
const ANNOUNCE_WINDOW_MS = 2 * 60_000;

interface ModelStore {
  catalog: ModelCatalog | null;
  refreshing: boolean;
  /** `finishedAt` of the last refresh we've already reacted to. */
  seenFinishedAt: string | null;
  /** Loads the saved model lists (call once at app start). */
  load: () => Promise<void>;
  /** Manual "Refresh model lists" button. */
  refresh: () => Promise<void>;
  /** Called with every health check; reloads + announces when a background refresh finishes. */
  sync: (status: ModelRefreshStatus) => void;
}

/**
 * Toast text for a finished refresh, e.g. "Model lists populated: OpenRouter 312 · OpenAI 58 (no key: Google)".
 * @param status - Result of the refresh.
 */
function announce(status: ModelRefreshStatus): void {
  const counts = Object.entries(status.counts)
    .map(([p, n]) => `${PROVIDER_LABELS[p as Provider]} ${n}`)
    .join(" · ");
  const skipped = status.skipped.length
    ? ` (no key: ${status.skipped.map((p) => PROVIDER_LABELS[p]).join(", ")})`
    : "";
  toast({ kind: "success", message: `Model lists populated: ${counts || "none"}${skipped}` });
  if (status.errors.length)
    toast({ kind: "error", message: `Model lists failed: ${status.errors.join(" · ")}` });
}

export const useModelStore = create<ModelStore>((set, get) => ({
  catalog: null,
  refreshing: false,
  seenFinishedAt: null,
  load: async () => {
    try {
      set({ catalog: await api.get<ModelCatalog>("/llm/models") });
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    }
  },
  refresh: async () => {
    set({ refreshing: true });
    try {
      const res = await api.post<{ catalog: ModelCatalog; status: ModelRefreshStatus }>(
        "/llm/models/refresh",
      );
      set({ catalog: res.catalog, seenFinishedAt: res.status.finishedAt });
      announce(res.status);
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    } finally {
      set({ refreshing: false });
    }
  },
  sync: (status) => {
    set({ refreshing: status.refreshing });
    const { finishedAt } = status;
    if (!finishedAt || finishedAt === get().seenFinishedAt) return;
    set({ seenFinishedAt: finishedAt });
    void get().load();
    if (Date.now() - new Date(finishedAt).getTime() < ANNOUNCE_WINDOW_MS) announce(status);
  },
}));
