import { describe, expect, it } from "vitest";
import { extractJson } from "./aiJson.ts";

describe("extractJson", () => {
  it("reads plain, fenced, and chatty replies", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson('```json\n{"a":2}\n```')).toEqual({ a: 2 });
    expect(extractJson('Sure! Here it is: {"a":3} Hope that helps.')).toEqual({ a: 3 });
  });

  it("throws when there is no JSON object", () => {
    expect(() => extractJson("no json here")).toThrow();
  });
});
