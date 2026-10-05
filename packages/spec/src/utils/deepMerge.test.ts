import { describe, expect, it } from "vitest";
import { deepMerge } from "./deepMerge.ts";

describe("deepMerge", () => {
  it("merges nested objects without mutating inputs", () => {
    const base = { a: { b: 1, c: 2 }, d: 3 };
    const result = deepMerge(base, { a: { c: 9 } });
    expect(result).toEqual({ a: { b: 1, c: 9 }, d: 3 });
    expect(base.a.c).toBe(2);
  });

  it("replaces arrays and skips undefined values", () => {
    expect(deepMerge({ list: [1, 2], x: 1 }, { list: [3], x: undefined })).toEqual({
      list: [3],
      x: 1,
    });
  });
});
