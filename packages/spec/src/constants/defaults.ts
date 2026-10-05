import type { Settings } from "../schemas/settings.ts";

/** Default ports; also used by vite.config.ts. */
export const DEFAULT_SERVER_PORT = 5174;
export const DEFAULT_WEB_PORT = 5173;

export const DEFAULT_SETTINGS: Settings = {
  app: {
    serverPort: DEFAULT_SERVER_PORT,
    webPort: DEFAULT_WEB_PORT,
    outputsDir: "outputs",
    refsDir: "refs",
    saveMode: "both",
    autosaveSeconds: 10,
    setupChecks: { blender: true, comfy: true },
    updateCheck: "daily",
    backgroundPattern: "voxels",
    customBackground: "",
  },
  llm: {
    apiKeys: {
      anthropic: "",
      openai: "",
      google: "",
      openrouter: "",
      gateway: "",
      huggingface: "",
    },
    tasks: {
      promptEnhancer: { provider: "anthropic", model: "claude-sonnet-5" },
      vision: { provider: "anthropic", model: "claude-sonnet-5" },
      buildPlan: { provider: "anthropic", model: "claude-sonnet-5" },
      blenderAgent: { provider: "anthropic", model: "claude-opus-5-5" },
      suggestions: { provider: "anthropic", model: "claude-haiku-4-5-20251001" },
    },
  },
  comfy: {
    url: "http://127.0.0.1:8188",
    launchCommand: "",
    workingDir: "",
    workflowTemplate: "config/comfy/txt2img.api.json",
    nodeMap: { positive: "6", negative: "7", sampler: "3", checkpoint: "4" },
    checkpoint: "",
    detectedVersion: "",
  },
  blender: {
    exePath: "",
    mcpCommand: "uvx",
    mcpArgs: ["blender-mcp"],
    host: "localhost",
    port: 9876,
    stepBudget: 12,
    recipesDir: "blender/recipes",
    startupScript: "blender/startup.py",
    detectedVersion: "",
  },
};
