import { describe, expect, it } from "vitest";
import { fillWorkflow, type ComfyWorkflow } from "./comfy.ts";

const nodeMap = { positive: "6", negative: "7", sampler: "3", checkpoint: "4" };
const template: ComfyWorkflow = {
  "3": { class_type: "KSampler", inputs: { seed: 0 } },
  "4": { class_type: "CheckpointLoaderSimple", inputs: { ckpt_name: "" } },
  "6": { class_type: "CLIPTextEncode", inputs: { text: "" } },
  "7": { class_type: "CLIPTextEncode", inputs: { text: "" } },
};
const empty = { positive: "", negative: "", seed: 0, checkpoint: "" };

describe("fillWorkflow", () => {
  it("fills prompts, seed, and checkpoint without touching the template", () => {
    const filled = fillWorkflow(template, nodeMap, {
      positive: "cat",
      negative: "blurry",
      seed: 42,
      checkpoint: "sdxl.safetensors",
    });
    expect(filled["6"]?.inputs.text).toBe("cat");
    expect(filled["7"]?.inputs.text).toBe("blurry");
    expect(filled["3"]?.inputs.seed).toBe(42);
    expect(filled["4"]?.inputs.ckpt_name).toBe("sdxl.safetensors");
    expect(template["6"]?.inputs.text).toBe("");
  });

  it("names the missing node when the map doesn't fit the template", () => {
    expect(() => fillWorkflow(template, { ...nodeMap, positive: "99" }, empty)).toThrow(/"99"/);
  });
});
