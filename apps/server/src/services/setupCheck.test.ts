import { describe, expect, it } from "vitest";
import { compareVersions, isUpdateCheckDue, versionFromPath, withLatest } from "./setupCheck.ts";

describe("compareVersions", () => {
  it("compares numerically, not as text", () => {
    expect(compareVersions("3.10", "3.9")).toBeGreaterThan(0);
    expect(compareVersions("3.0", "3.1")).toBeLessThan(0);
    expect(compareVersions("4.2", "4.2")).toBe(0);
  });
});

describe("versionFromPath", () => {
  it("reads the version from the install folder name", () => {
    expect(versionFromPath("C:\\Program Files\\Blender Foundation\\Blender 4.2\\blender.exe")).toBe(
      "4.2",
    );
    expect(versionFromPath("D:\\tools\\blender-5.0.1-windows-x64\\blender.exe")).toBe("5.0");
    expect(versionFromPath("D:\\apps\\blender\\blender.exe")).toBeNull();
  });
});

describe("withLatest", () => {
  const found = {
    state: "ok" as const,
    path: "x",
    version: "4.2",
    message: "ready",
    downloadUrl: "u",
  };

  it("flags an older install, comparing at the installed precision", () => {
    expect(withLatest(found, "5.2.2", "Blender")).toMatchObject({
      updateAvailable: true,
      latestVersion: "5.2.2",
    });
    expect(withLatest({ ...found, version: "5.2" }, "5.2.2", "Blender").updateAvailable).toBe(
      false,
    );
  });

  it("never flags when either version is unknown or the program isn't usable", () => {
    expect(withLatest(found, null, "Blender").updateAvailable).toBe(false);
    expect(withLatest({ ...found, version: null }, "5.2.2", "Blender").updateAvailable).toBe(false);
    expect(withLatest({ ...found, state: "too-old" }, "5.2.2", "Blender").updateAvailable).toBe(
      false,
    );
  });
});

describe("isUpdateCheckDue", () => {
  const now = new Date(2026, 9, 1, 9, 0); // Oct 1, 9:00 local

  it("daily: once per calendar day, not per 24 hours", () => {
    expect(isUpdateCheckDue(new Date(2026, 9, 1, 0, 5).toISOString(), "daily", now)).toBe(false);
    expect(isUpdateCheckDue(new Date(2026, 8, 30, 23, 50).toISOString(), "daily", now)).toBe(true);
  });

  it("weekly: after 7 days", () => {
    expect(isUpdateCheckDue(new Date(2026, 8, 28).toISOString(), "weekly", now)).toBe(false);
    expect(isUpdateCheckDue(new Date(2026, 8, 20).toISOString(), "weekly", now)).toBe(true);
  });

  it("first run is always due, except in manual mode which never checks on its own", () => {
    expect(isUpdateCheckDue(null, "daily", now)).toBe(true);
    expect(isUpdateCheckDue(null, "manual", now)).toBe(false);
  });
});
