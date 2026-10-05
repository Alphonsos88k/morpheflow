import { describe, expect, it } from "vitest";
import { costOf, normalizeModelId } from "./cost.ts";

describe("normalizeModelId", () => {
  it("matches direct and host IDs of the same model", () => {
    expect(normalizeModelId("claude-haiku-4-5-20251001")).toBe("claude-haiku-4-5");
    expect(normalizeModelId("anthropic/claude-haiku-4.5")).toBe("claude-haiku-4-5");
    expect(normalizeModelId("openai/gpt-5")).toBe(normalizeModelId("gpt-5"));
  });
});

describe("costOf", () => {
  it("prices tokens per million", () => {
    expect(costOf(1_000_000, 500_000, { inputPerMTok: 3, outputPerMTok: 15 })).toBeCloseTo(10.5);
    expect(costOf(0, 0, { inputPerMTok: 3, outputPerMTok: 15 })).toBe(0);
  });
});
