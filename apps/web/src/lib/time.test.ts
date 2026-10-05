import { describe, expect, it } from "vitest";
import { timeAgo } from "./time.ts";

const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

describe("timeAgo", () => {
  it("says just now under a minute, then counts minutes and hours", () => {
    expect(timeAgo(ago(10_000))).toBe("just now");
    expect(timeAgo(ago(5 * 60_000))).toMatch(/5 minutes ago/);
    expect(timeAgo(ago(3 * 3_600_000))).toMatch(/3 hours ago/);
  });
});
