import { create } from "zustand";
import {
  createSession,
  type Session,
  type StepId,
  type StepStatus,
  type UsageEntry,
} from "@morpheflow/spec";
import { toast } from "../components/ui/toastStore.ts";
import { api, messageOf } from "../lib/api.ts";
import {
  markDownstreamOutdated,
  reachedAfter,
  stepNavigation,
  withStatus,
} from "../features/stepper/stepLogic.ts";

interface SessionStore {
  /** The current session: Scene Spec, step states, results, usage. */
  session: Session;
  /** Changed since the last save. */
  dirty: boolean;
  lastSavedAt: string | null;
  saving: boolean;

  /** Updates the idea text; later finished steps become "outdated". */
  setPrompt: (prompt: string) => void;
  goTo: (step: StepId) => void;
  /**
   * Back (-1) / Next (+1), skipping switched-off steps. Next only goes to steps already reached.
   * Used by the Back/Next buttons and Alt+← / Alt+→.
   */
  goRelative: (delta: 1 | -1) => void;
  /** Switches an optional step on/off. */
  toggleStep: (step: StepId) => void;
  setStepStatus: (step: StepId, status: StepStatus) => void;
  setResults: (patch: Partial<Session["results"]>) => void;
  addUsage: (entries: UsageEntry[]) => void;
  /** Starts a fresh session (the old one stays saved on disk). */
  newSession: () => void;
  /** Writes the session to outputs/<id>/session.json. */
  save: () => Promise<void>;
}

export const useSessionStore = create<SessionStore>((set, get) => {
  /** Applies a change to the session and marks it unsaved. */
  const change = (fn: (s: Session) => Session) => set({ session: fn(get().session), dirty: true });

  return {
    session: createSession(),
    dirty: false,
    lastSavedAt: null,
    saving: false,

    setPrompt: (prompt) =>
      change((s) => ({
        ...s,
        scene: { ...s.scene, prompt },
        steps: s.scene.prompt === prompt ? s.steps : markDownstreamOutdated(s.steps, "prompt"),
      })),
    goTo: (step) =>
      change((s) => ({
        ...s,
        currentStep: step,
        maxReachedStep: reachedAfter(s.maxReachedStep, step),
      })),
    goRelative: (delta) => {
      const nav = stepNavigation(get().session);
      const target = delta === 1 ? (nav.nextReached ? nav.next : null) : nav.back;
      if (target) get().goTo(target);
    },
    toggleStep: (step) =>
      change((s) => ({
        ...s,
        steps: { ...s.steps, [step]: { ...s.steps[step], enabled: !s.steps[step].enabled } },
      })),
    setStepStatus: (step, status) =>
      change((s) => ({ ...s, steps: withStatus(s.steps, step, status) })),
    setResults: (patch) => change((s) => ({ ...s, results: { ...s.results, ...patch } })),
    addUsage: (entries) => change((s) => ({ ...s, usage: [...s.usage, ...entries] })),
    newSession: () => set({ session: createSession(), dirty: false, lastSavedAt: null }),

    save: async () => {
      const { session, saving } = get();
      // An untouched new session has nothing worth saving yet.
      if (saving || !session.scene.prompt.trim()) return;
      set({ saving: true });
      try {
        const saved = await api.put<Session>(`/sessions/${session.id}`, session);
        // Only clear "dirty" if nothing changed while the save was in flight.
        set((state) => ({
          lastSavedAt: saved.updatedAt,
          dirty: state.session === session ? false : state.dirty,
        }));
      } catch (err) {
        toast({ kind: "error", message: `Couldn't save session: ${messageOf(err)}` });
      } finally {
        set({ saving: false });
      }
    },
  };
});
