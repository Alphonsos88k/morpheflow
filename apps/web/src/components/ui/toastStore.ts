import { create } from "zustand";

export type ToastKind = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
  /** Optional buttons, e.g. Launch / Retry / Skip. Toasts with actions stay until dismissed. */
  actions?: ToastAction[];
}

interface ToastState {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
}

const AUTO_DISMISS_MS = 5000;
/** Oldest toasts are dropped beyond this, so a burst of errors can't fill the screen. */
const MAX_TOASTS = 4;
let nextId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = nextId++;
    set({ toasts: [...get().toasts, { ...toast, id }].slice(-MAX_TOASTS) });
    if (!toast.actions?.length) setTimeout(() => get().dismiss(id), AUTO_DISMISS_MS);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

/** Shows a toast from anywhere: `toast({ kind: "error", message: "…" })`. */
export const toast = (t: Omit<Toast, "id">) => useToastStore.getState().push(t);
