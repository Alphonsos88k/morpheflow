/** The 9 app steps, in order (designs.md §3). */
export const STEP_IDS = [
  "prompt",
  "clarify",
  "enhance",
  "comfy",
  "inspiration",
  "plan",
  "build",
  "iterate",
  "export",
] as const;
export type StepId = (typeof STEP_IDS)[number];

export interface StepDef {
  id: StepId;
  name: string;
  /** Can be switched off on the rail. */
  optional: boolean;
  /** On or off in a new session. */
  defaultOn: boolean;
}

export const STEP_DEFS: readonly StepDef[] = [
  { id: "prompt", name: "Prompt", optional: false, defaultOn: true },
  { id: "clarify", name: "Clarify", optional: true, defaultOn: true },
  { id: "enhance", name: "Enhanced prompt", optional: true, defaultOn: true },
  { id: "comfy", name: "ComfyUI images", optional: true, defaultOn: true },
  { id: "inspiration", name: "Inspiration board", optional: true, defaultOn: true },
  { id: "plan", name: "Build plan", optional: false, defaultOn: true },
  { id: "build", name: "Blender build", optional: false, defaultOn: true },
  { id: "iterate", name: "Iterate", optional: false, defaultOn: true },
  { id: "export", name: "Export", optional: true, defaultOn: false },
];

/** Where a step stands. "outdated" = an earlier step changed after this one finished. */
export const STEP_STATUSES = ["idle", "running", "done", "error", "outdated"] as const;
export type StepStatus = (typeof STEP_STATUSES)[number];
