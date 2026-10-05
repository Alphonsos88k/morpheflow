import { STEP_DEFS, type StepStatus } from "@morpheflow/spec";
import { KEYBINDS, goToStepCombo, keyLabel } from "../../constants/keybinds.ts";
import { READY_STEPS } from "../../constants/steps.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { useUiStore } from "../../stores/uiStore.ts";

/** Square marker on the progress line, per step status. */
const NODE: Record<StepStatus, string> = {
  idle: "border-line bg-bg",
  running: "border-warn bg-warn animate-pulse",
  done: "border-ok bg-ok",
  error: "border-bad bg-bad",
  outdated: "border-warn bg-bg",
};

/** Small caption under the step name. */
const STATUS_CAPTION: Record<StepStatus, { text: string; className: string } | null> = {
  idle: null,
  running: { text: "Running…", className: "text-warn" },
  done: { text: "Done", className: "text-ok/80" },
  error: { text: "Failed: retry from the step", className: "text-bad" },
  outdated: { text: "Outdated: prompt changed", className: "text-warn" },
};

/**
 * Hover text, e.g. "Clarify (Alt+2) · arrives in Stage 3".
 * @param name - Step name.
 * @param index - 0-based position (for its Alt+N shortcut).
 * @param ready - Has a working screen yet.
 */
function stepTooltip(name: string, index: number, ready: boolean): string {
  const parts = [`${name} (${keyLabel(goToStepCombo(index))})`];
  if (!ready) parts.push("arrives in Stage 3");
  return parts.join(" · ");
}

/**
 * Left-hand list of the 9 steps (designs.md §3). Sharp, roomy rows; the whole row is the click
 * target. Current step: accent bar slides in, soft glow, fading accent wash. Status shows as a
 * square marker on the progress line plus a short caption. Alt+1…9 jump, Alt+←/→ move.
 * Optional steps have a square on/off switch; switched-off steps are dimmed but still visitable.
 * Collapsible (« button or Ctrl+B) down to a slim strip of markers + numbers.
 */
export function StepRail() {
  const { session, goTo, toggleStep } = useSessionStore();
  const { railCollapsed: collapsed, toggleRail } = useUiStore();
  const railKey = keyLabel(KEYBINDS.toggleRail);

  return (
    <nav
      className={`relative flex shrink-0 flex-col gap-1 overflow-hidden border-r border-line py-4 transition-[width] duration-200 ${
        collapsed ? "w-14 px-1" : "w-60 px-2"
      }`}
      aria-label="Steps"
    >
      <div
        className={`flex items-center pb-2 ${collapsed ? "justify-center" : "justify-between px-3"}`}
      >
        {!collapsed && (
          <span className="text-[10px] font-semibold tracking-[0.18em] text-muted/70 uppercase">
            Steps
          </span>
        )}
        <button
          onClick={toggleRail}
          title={`${collapsed ? "Expand" : "Collapse"} step list (${railKey})`}
          aria-label={collapsed ? "Expand step list" : "Collapse step list"}
          className="grid size-7 place-items-center border border-line font-mono text-sm leading-none text-muted transition-[background-color,border-color,color,transform] duration-100 hover:border-muted hover:bg-surface-2 hover:text-fg active:translate-y-px"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
      {/* The progress line the step markers sit on. */}
      <span
        className={`pointer-events-none absolute top-[54px] bottom-8 w-px bg-line ${collapsed ? "left-[19px]" : "left-[25px]"}`}
      />

      {STEP_DEFS.map((step, i) => {
        const state = session.steps[step.id];
        const current = session.currentStep === step.id;
        const ready = READY_STEPS.has(step.id);
        const caption = STATUS_CAPTION[state.status];
        return (
          <div key={step.id} className={`group relative ${state.enabled ? "" : "opacity-45"}`}>
            <button
              onClick={() => goTo(step.id)}
              title={stepTooltip(step.name, i, ready)}
              aria-label={collapsed ? step.name : undefined}
              aria-current={current ? "step" : undefined}
              className={`relative flex min-h-10 w-full items-center gap-3 overflow-hidden py-2 pl-3 text-left ${collapsed ? "pr-2" : "pr-10"} transition-[background-color,color,transform] duration-150 active:scale-[0.985] ${
                current
                  ? "bg-gradient-to-r from-accent/14 via-accent/5 to-transparent text-fg"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              {/* Side highlight: slides in for the current step, half-height hint on hover. */}
              <span
                className={`absolute inset-y-0 left-0 w-0.5 transition-transform duration-200 ${
                  current
                    ? "scale-y-100 bg-accent shadow-[0_0_12px] shadow-accent/70"
                    : "scale-y-0 bg-muted/70 group-hover:scale-y-50"
                }`}
              />
              <span
                className={`relative z-10 size-2 shrink-0 border transition-all duration-200 ${NODE[state.status]} ${
                  current ? "scale-125" : ""
                } ${current && state.status === "idle" ? "border-accent bg-accent/40 shadow-[0_0_8px] shadow-accent/60" : ""}`}
              />
              {collapsed ? (
                <span
                  className={`font-mono text-[10px] ${current ? "text-accent" : "text-muted/60"}`}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ) : (
                <span className="flex min-w-0 flex-col">
                  <span className="flex items-baseline gap-2">
                    <span
                      className={`font-mono text-[10px] ${current ? "text-accent" : "text-muted/60"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`truncate text-[13px] transition-transform duration-150 group-hover:translate-x-0.5 ${
                        current ? "font-medium" : ""
                      } ${ready ? "" : "text-muted/80"}`}
                    >
                      {step.name}
                    </span>
                  </span>
                  {caption && (
                    <span className={`pl-[26px] text-[10px] leading-tight ${caption.className}`}>
                      {caption.text}
                    </span>
                  )}
                </span>
              )}
            </button>
            {step.optional && !collapsed && (
              <button
                role="switch"
                aria-checked={state.enabled}
                aria-label={`${state.enabled ? "Turn off" : "Turn on"} ${step.name}`}
                title={state.enabled ? "On (click to skip this step)" : "Off (click to include)"}
                onClick={() => toggleStep(step.id)}
                className={`absolute top-1/2 right-3 h-3 w-[22px] -translate-y-1/2 border transition-colors duration-150 ${
                  state.enabled ? "border-accent/70 bg-accent/20" : "border-line hover:border-muted"
                }`}
              >
                <span
                  className={`block h-2 w-2 transition-transform duration-150 ${
                    state.enabled ? "translate-x-[11px] bg-accent" : "translate-x-px bg-muted"
                  }`}
                />
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
