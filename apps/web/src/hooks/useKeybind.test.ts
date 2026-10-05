import { describe, expect, it } from "vitest";
import { matchesCombo } from "./useKeybind.ts";

type Mods = Partial<Record<"ctrlKey" | "altKey" | "shiftKey", boolean>>;
const press = (key: string, mods: Mods = {}) =>
  ({ key, ctrlKey: false, altKey: false, shiftKey: false, ...mods }) as KeyboardEvent;

describe("matchesCombo", () => {
  it("requires exactly the listed modifiers", () => {
    expect(matchesCombo(press("k", { ctrlKey: true }), "ctrl+k")).toBe(true);
    expect(matchesCombo(press("k", { ctrlKey: true, shiftKey: true }), "ctrl+k")).toBe(false);
    expect(matchesCombo(press("k"), "ctrl+k")).toBe(false);
  });

  it("handles named keys case-insensitively", () => {
    expect(matchesCombo(press("ArrowLeft", { altKey: true }), "alt+arrowleft")).toBe(true);
    expect(matchesCombo(press(",", { ctrlKey: true }), "ctrl+,")).toBe(true);
  });
});
