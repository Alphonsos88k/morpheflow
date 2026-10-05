import { describe, expect, it } from "vitest";
import { expandIncludes, fillTemplate, loadSystemPrompt } from "./systemPrompts.ts";

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

  it("pulls the shared looks list into the Blender agent prompt", () => {
    const prompt = loadSystemPrompt("blender_agent");
    expect(prompt).toContain("Low poly");
    expect(prompt).not.toContain("{{>");
  });
});

describe("expandIncludes", () => {
  it("throws on an unknown include so typos surface", () => {
    expect(() => expandIncludes("{{> no_such_file}}")).toThrow(/no_such_file/);
  });
});
