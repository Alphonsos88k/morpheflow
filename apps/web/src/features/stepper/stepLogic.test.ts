import { describe, expect, it } from "vitest";
import { createSession } from "@morpheflow/spec";
import {
  adjacentEnabledStep,
  markDownstreamOutdated,
  reachedAfter,
  stepAt,
  stepNavigation,
  withStatus,
} from "./stepLogic.ts";

describe("markDownstreamOutdated", () => {
  it("marks only later finished steps as outdated", () => {
    let steps = createSession().steps;
    steps = withStatus(steps, "prompt", "done");
    steps = withStatus(steps, "comfy", "done");
    steps = withStatus(steps, "build", "error");
    const result = markDownstreamOutdated(steps, "prompt");
    expect(result.prompt.status).toBe("done");
    expect(result.comfy.status).toBe("outdated");
    expect(result.build.status).toBe("error");
  });
});

describe("stepAt", () => {
  it("moves and clamps at both ends", () => {
    expect(stepAt("prompt", 1)).toBe("clarify");
    expect(stepAt("prompt", -1)).toBe("prompt");
    expect(stepAt("export", 1)).toBe("export");
  });
});

describe("Back / Next", () => {
  it("skips switched-off steps in both directions", () => {
    const steps = createSession().steps;
    steps.clarify = { ...steps.clarify, enabled: false };
    steps.enhance = { ...steps.enhance, enabled: false };
    expect(adjacentEnabledStep(steps, "prompt", 1)).toBe("comfy");
    expect(adjacentEnabledStep(steps, "comfy", -1)).toBe("prompt");
    expect(adjacentEnabledStep(steps, "prompt", -1)).toBeNull();
  });

  it("only allows Next to steps already reached", () => {
    const session = createSession();
    expect(stepNavigation(session)).toMatchObject({
      back: null,
      next: "clarify",
      nextReached: false,
    });
    const reached = { ...session, maxReachedStep: reachedAfter(0, "build") };
    expect(stepNavigation(reached).nextReached).toBe(true);
    expect(stepNavigation({ ...reached, currentStep: "build" })).toMatchObject({
      next: "iterate",
      nextReached: false,
    });
  });
});
