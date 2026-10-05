import { describe, expect, it } from "vitest";
import { migrateLegacyKeys } from "./settingsStore.ts";

describe("migrateLegacyKeys", () => {
  it("moves old key fields into llm.apiKeys", () => {
    const migrated = migrateLegacyKeys({
      llm: { anthropicApiKey: "sk-a", openrouterApiKey: "sk-o", tasks: {} },
    });
    expect(migrated).toEqual({
      llm: { tasks: {}, apiKeys: { anthropic: "sk-a", openrouter: "sk-o" } },
    });
  });

  it("leaves new-format settings alone", () => {
    const current = { llm: { apiKeys: { openai: "x" } } };
    expect(migrateLegacyKeys(current)).toBe(current);
  });
});
