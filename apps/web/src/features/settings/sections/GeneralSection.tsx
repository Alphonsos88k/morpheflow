import type { PublicSettings } from "@morpheflow/spec";
import { Button, PathField, Select, TextField, Toggle } from "../../../components/ui/index.ts";
import { KEYBINDS, keyLabel } from "../../../constants/keybinds.ts";
import {
  BACKGROUND_LABELS,
  PATTERNS_FOLDER,
  type BackgroundPattern,
} from "../../../constants/patterns.ts";
import { PATH_FILTERS } from "../../../lib/pickPath.ts";
import type { SectionProps } from "./types.ts";

type SaveMode = PublicSettings["app"]["saveMode"];
const SAVE_MODES: readonly SaveMode[] = ["both", "auto", "manual"];
type UpdateCheck = PublicSettings["app"]["updateCheck"];
const UPDATE_CHECKS: readonly UpdateCheck[] = ["daily", "weekly", "manual"];
const BACKGROUNDS: readonly BackgroundPattern[] = ["voxels", "floor", "dots", "none"];

/** Session saving, where session files go, and setup-check prompts. */
export function GeneralSection({ draft, setDraft }: SectionProps) {
  const set = (patch: Partial<PublicSettings["app"]>) =>
    setDraft({ ...draft, app: { ...draft.app, ...patch } });
  const saveKey = keyLabel(KEYBINDS.saveSession);
  return (
    <div className="flex flex-col gap-6">
      <Select
        label="Save sessions"
        value={draft.app.saveMode}
        options={SAVE_MODES}
        labels={{
          both: `Automatically + ${saveKey}`,
          auto: "Automatically only",
          manual: `${saveKey} only`,
        }}
        onChange={(saveMode) => set({ saveMode })}
      />
      <TextField
        label="Autosave every (seconds)"
        type="number"
        min={3}
        max={600}
        value={String(draft.app.autosaveSeconds)}
        disabled={draft.app.saveMode === "manual"}
        onChange={(v) => set({ autosaveSeconds: Number(v) })}
        hint="Only saves when something changed."
      />
      <PathField
        kind="folder"
        label="Outputs folder"
        value={draft.app.outputsDir}
        onChange={(outputsDir) => set({ outputsDir })}
        hint="Each session gets a subfolder here: session.json, images, and .blend backups. Relative paths start at the project folder."
      />
      <Select
        label="Background"
        value={draft.app.backgroundPattern}
        options={BACKGROUNDS}
        labels={BACKGROUND_LABELS}
        // Picking a preset switches back from a custom file.
        onChange={(backgroundPattern) => set({ backgroundPattern, customBackground: "" })}
      />
      <div className="flex items-end gap-2">
        <PathField
          className="flex-1"
          kind="file"
          filter={PATH_FILTERS.background}
          startIn={PATTERNS_FOLDER}
          label="Custom background (overrides the choice above)"
          value={draft.app.customBackground}
          onChange={(customBackground) => set({ customBackground })}
          placeholder="none: pick an .svg (tiles) or .png / .jpg / .webp (fills)"
        />
        {draft.app.customBackground && (
          <Button className="mb-px" onClick={() => set({ customBackground: "" })}>
            Clear
          </Button>
        )}
      </div>
      <Select
        label="Check for new Blender / ComfyUI versions"
        value={draft.app.updateCheck}
        options={UPDATE_CHECKS}
        labels={{
          daily: "Once a day (on first launch of the day)",
          weekly: "Once a week",
          manual: "Only when I click Check now",
        }}
        onChange={(updateCheck) => set({ updateCheck })}
      />
      <div className="flex flex-col gap-2">
        <span className="text-sm text-muted">Setup checks</span>
        <div className="flex flex-wrap gap-2">
          {(["blender", "comfy"] as const).map((dep) => (
            <Toggle
              key={dep}
              label={
                dep === "blender" ? "Ask when Blender is missing" : "Ask when ComfyUI is missing"
              }
              checked={draft.app.setupChecks[dep]}
              onChange={(on) => set({ setupChecks: { ...draft.app.setupChecks, [dep]: on } })}
            />
          ))}
        </div>
        <span className="text-xs text-muted/80">
          Off = never show the setup card for that program ("Don't ask again" turns these off).
        </span>
      </div>
    </div>
  );
}
