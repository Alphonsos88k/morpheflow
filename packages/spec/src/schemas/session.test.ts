import { describe, expect, it } from "vitest";
import { STEP_DEFS } from "../constants/steps.ts";
import { SessionSchema, createSession } from "./session.ts";

describe("createSession", () => {
  it("produces a valid session with default step toggles", () => {
    const session = createSession("tiger man");
    expect(SessionSchema.parse(session)).toEqual(session);
    expect(session.scene.prompt).toBe("tiger man");
    for (const step of STEP_DEFS) expect(session.steps[step.id].enabled).toBe(step.defaultOn);
  });
});
