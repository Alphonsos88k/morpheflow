import { describe, expect, it } from "vitest";
import { fillTemplate, loadSystemPrompt } from "./systemPrompts.ts";

describe("fillTemplate", () => {
  it("fills placeholders and strips human notes", () => {
    expect(fillTemplate("<!-- note -->\nHi {{ name }}!", { name: "Ada" })).toBe("Hi Ada!");
  });

  it("throws on a missing value so typos surface", () => {
    expect(() => fillTemplate("{{missing}}")).toThrow(/missing/);
  });
});

describe("loadSystemPrompt", () => {
  it("reads the Blender agent prompt from system_prompts/", () => {
    expect(loadSystemPrompt("blender_agent")).toContain("Blender");
  });
});
