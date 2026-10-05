import { STEP_IDS, type Session, type StepId, type StepStatus } from "@morpheflow/spec";

type Steps = Session["steps"];

/**
 * After a step's input changes, every *later* step that had finished is marked "outdated".
 * Nothing re-runs automatically; the user decides what to redo (designs.md §3).
 * @param steps - Current step states (not modified).
 * @param changed - The step whose content changed.
 * @returns New step states.
 */
export function markDownstreamOutdated(steps: Steps, changed: StepId): Steps {
  const from = STEP_IDS.indexOf(changed);
  const next = { ...steps };
  for (const id of STEP_IDS.slice(from + 1)) {
    if (next[id].status === "done") next[id] = { ...next[id], status: "outdated" };
  }
  return next;
}

/**
 * The step `delta` places away, clamped to the first/last step. Disabled steps can still be visited.
 * @param current - Current step.
 * @param delta - e.g. +1 for next, -1 for previous.
 */
export function stepAt(current: StepId, delta: number): StepId {
  const index = Math.min(Math.max(STEP_IDS.indexOf(current) + delta, 0), STEP_IDS.length - 1);
  return STEP_IDS[index] ?? current;
}

/**
 * Returns step states with one step's status changed.
 * @param steps - Current step states (not modified).
 * @param id - Which step.
 * @param status - New status.
 */
export function withStatus(steps: Steps, id: StepId, status: StepStatus): Steps {
  return { ...steps, [id]: { ...steps[id], status } };
}

/**
 * The nearest switched-on step before/after `current`, skipping steps that are turned off.
 * @param steps - Step states (for on/off).
 * @param current - Where we are.
 * @param direction - +1 for Next, -1 for Back.
 * @returns That step, or null at either end.
 */
export function adjacentEnabledStep(
  steps: Steps,
  current: StepId,
  direction: 1 | -1,
): StepId | null {
  for (
    let i = STEP_IDS.indexOf(current) + direction;
    i >= 0 && i < STEP_IDS.length;
    i += direction
  ) {
    const id = STEP_IDS[i];
    if (id && steps[id].enabled) return id;
  }
  return null;
}

/**
 * Where Back/Next lead, and whether Next is allowed (only to steps already reached).
 * @param session - Current session.
 */
export function stepNavigation(session: Pick<Session, "steps" | "currentStep" | "maxReachedStep">) {
  const back = adjacentEnabledStep(session.steps, session.currentStep, -1);
  const next = adjacentEnabledStep(session.steps, session.currentStep, 1);
  const nextReached = next !== null && STEP_IDS.indexOf(next) <= session.maxReachedStep;
  return { back, next, nextReached };
}

/**
 * Furthest step reached after visiting `step`.
 * @param maxReached - Previous furthest index.
 * @param step - Step being visited.
 */
export const reachedAfter = (maxReached: number, step: StepId) =>
  Math.max(maxReached, STEP_IDS.indexOf(step));
