import type { StepId } from "@morpheflow/spec";

/**
 * Steps that have a working screen in the current build stage. The rest show a
 * "coming in Stage 3" placeholder but can still be visited and toggled.
 * Step names/order/defaults live in the shared package (STEP_DEFS).
 */
export const READY_STEPS: ReadonlySet<StepId> = new Set<StepId>(["prompt", "comfy", "build"]);
