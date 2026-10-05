import { STEP_DEFS } from "@morpheflow/spec";
import { KEYBINDS, goToStepCombo } from "../../constants/keybinds.ts";
import { launchService } from "../../lib/services.ts";
import { useModelStore } from "../../stores/modelStore.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { useSetupStore } from "../../stores/setupStore.ts";
import { useUiStore } from "../../stores/uiStore.ts";
import { runPipeline } from "../run/runPipeline.ts";

export interface Command {
  id: string;
  title: string;
  /** Palette grouping, e.g. "Steps". */
  group: string;
  /** Shortcut from KEYBINDS, if any. */
  combo?: string;
  run: () => void;
  /** Also fire while typing in a text field (for Ctrl-combos). Defaults to true for combos with Ctrl. */
  inInputs?: boolean;
}

/**
 * Every action the app offers, used by both the Ctrl+K palette and global keyboard shortcuts.
 * Add new actions here so they're searchable and bindable in one place.
 */
export function useCommands(): Command[] {
  const ui = useUiStore();
  const session = useSessionStore();
  const refreshModels = useModelStore((s) => s.refresh);

  return [
    {
      id: "palette",
      title: "Command palette",
      group: "App",
      combo: KEYBINDS.commandPalette,
      run: () => ui.setPaletteOpen(!ui.paletteOpen),
    },
    {
      id: "settings",
      title: "Open settings",
      group: "App",
      combo: KEYBINDS.toggleSettings,
      run: () => ui.setSettingsOpen(!ui.settingsOpen),
    },
    {
      id: "save",
      title: "Save session",
      group: "Session",
      combo: KEYBINDS.saveSession,
      run: () => void session.save(),
    },
    {
      id: "new",
      title: "New session",
      group: "Session",
      run: () => void session.save().then(session.newSession),
    },
    { id: "build", title: "Build (run prompt)", group: "Session", run: () => void runPipeline() },
    {
      id: "prev",
      title: "Previous step",
      group: "Steps",
      combo: KEYBINDS.prevStep,
      run: () => session.goRelative(-1),
    },
    {
      id: "next",
      title: "Next step",
      group: "Steps",
      combo: KEYBINDS.nextStep,
      run: () => session.goRelative(1),
    },
    ...STEP_DEFS.map((step, i) => ({
      id: `go-${step.id}`,
      title: `Go to ${i + 1}. ${step.name}`,
      group: "Steps",
      combo: goToStepCombo(i),
      run: () => session.goTo(step.id),
    })),
    {
      id: "toggle-rail",
      title: "Collapse / expand step list",
      group: "Steps",
      combo: KEYBINDS.toggleRail,
      run: () => ui.toggleRail(),
    },
    {
      id: "toggle-comfy",
      title: "Toggle ComfyUI step",
      group: "Steps",
      combo: KEYBINDS.toggleComfy,
      run: () => session.toggleStep("comfy"),
    },
    {
      id: "launch-comfy",
      title: "Launch ComfyUI",
      group: "Services",
      run: () => void launchService("comfy"),
    },
    {
      id: "launch-blender",
      title: "Launch Blender",
      group: "Services",
      run: () => void launchService("blender"),
    },
    {
      id: "refresh-models",
      title: "Refresh model lists",
      group: "Services",
      run: () => void refreshModels(),
    },
    {
      id: "check-updates",
      title: "Check for Blender / ComfyUI updates",
      group: "Services",
      run: () => void useSetupStore.getState().checkUpdates(),
    },
    {
      id: "check-setup",
      title: "Check setup (find Blender / ComfyUI)",
      group: "Services",
      run: () => {
        useSetupStore.getState().unsnoozeAll();
        void useSetupStore.getState().check();
      },
    },
  ];
}
