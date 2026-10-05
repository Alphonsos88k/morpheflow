import { STEP_DEFS, type StepId } from "@morpheflow/spec";
import { Kbd } from "../../components/ui/index.ts";
import { KEYBINDS, keyLabel } from "../../constants/keybinds.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { stepNavigation } from "./stepLogic.ts";

const nameOf = (id: StepId) => STEP_DEFS.find((s) => s.id === id)?.name ?? id;

/**
 * Back / Next at the bottom of every step. Both skip switched-off steps. Next is disabled until
 * its step has been reached once; on the first step it only appears after that (no dead button).
 */
export function StepNav() {
  const { session, goRelative } = useSessionStore();
  const { back, next, nextReached } = stepNavigation(session);
  const onFirstStep = back === null;
  if (onFirstStep && !nextReached) return null;

  const key =
    "group inline-flex items-center gap-2 border border-line px-4 py-2 text-xs font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform] duration-100 hover:bg-surface-2 hover:text-fg hover:shadow-[0_3px_8px_-2px_rgb(0_0_0/0.55)] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:shadow-none";

  return (
    <nav
      className="flex items-center justify-between border-t border-line pt-4"
      aria-label="Step navigation"
    >
      {back ? (
        <button
          className={`${key} text-muted`}
          onClick={() => goRelative(-1)}
          title={`Back to ${nameOf(back)}`}
        >
          ← Back <span className="text-muted/70">· {nameOf(back)}</span>
          <Kbd>{keyLabel(KEYBINDS.prevStep)}</Kbd>
        </button>
      ) : (
        <span />
      )}
      {next && (
        <button
          className={`${key} text-fg/90`}
          onClick={() => goRelative(1)}
          disabled={!nextReached}
          title={
            nextReached
              ? `Next: ${nameOf(next)}`
              : `Reach ${nameOf(next)} first (run this step or pick it on the step list)`
          }
        >
          Next <span className="text-muted/70">· {nameOf(next)}</span> →
          <Kbd>{keyLabel(KEYBINDS.nextStep)}</Kbd>
        </button>
      )}
    </nav>
  );
}
