import { describe, expect, it } from "vitest";
import { describeModel } from "./llm.ts";

describe("describeModel", () => {
  it("uses the provider as publisher for direct providers", () => {
    expect(describeModel("anthropic", "claude-opus-5-5", "Claude Opus 5.5")).toMatchObject({
      name: "Claude Opus 5.5",
      publisher: "Anthropic",
    });
  });

  it("splits OpenRouter-style names and maps ID prefixes", () => {
    expect(describeModel("openrouter", "openai/gpt-5", "OpenAI: GPT-5")).toMatchObject({
      name: "GPT-5",
      publisher: "OpenAI",
    });
    expect(describeModel("gateway", "meta-llama/llama-4")).toMatchObject({
      name: "llama-4",
      publisher: "Meta",
    });
    expect(describeModel("openrouter", "newco/model-x")).toMatchObject({ publisher: "Newco" });
  });
});
