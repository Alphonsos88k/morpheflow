import type { PublicSettings } from "@morpheflow/spec";
import { Button, PathField, TextField } from "../../../components/ui/index.ts";
import { PATH_FILTERS } from "../../../lib/pickPath.ts";
import { launchService } from "../../../lib/services.ts";
import { VersionRow } from "../VersionRow.tsx";
import type { SectionProps } from "./types.ts";

/** ComfyUI address, launch command, and checkpoint. */
export function ComfySection({ draft, setDraft }: SectionProps) {
  const set = (patch: Partial<PublicSettings["comfy"]>) =>
    setDraft({ ...draft, comfy: { ...draft.comfy, ...patch } });
  return (
    <div className="flex flex-col gap-6">
      <TextField
        label="ComfyUI URL"
        value={draft.comfy.url}
        onChange={(url) => set({ url })}
        hint="Portable: http://127.0.0.1:8188 · Desktop: often :8000"
      />
      <PathField
        kind="folder"
        label="ComfyUI folder"
        value={draft.comfy.workingDir}
        onChange={(workingDir) => set({ workingDir })}
        placeholder="C:\ComfyUI_windows_portable"
        hint="Portable (run_nvidia_gpu.bat / run_cpu.bat) or git install (main.py) is detected automatically"
      />
      <VersionRow dep="comfy" />
      <PathField
        kind="file"
        filter={PATH_FILTERS.launcher}
        quote
        label="Launch command (optional)"
        value={draft.comfy.launchCommand}
        onChange={(launchCommand) => set({ launchCommand })}
        placeholder="auto-detect"
        hint="Empty = auto-detect from the folder above, or ComfyUI Desktop in its default location"
      />
      <TextField
        label="Checkpoint"
        value={draft.comfy.checkpoint}
        onChange={(checkpoint) => set({ checkpoint })}
        hint="Empty = first installed checkpoint"
      />
      <PathField
        kind="file"
        filter={PATH_FILTERS.json}
        label="Workflow template"
        value={draft.comfy.workflowTemplate}
        onChange={(workflowTemplate) => set({ workflowTemplate })}
        hint="API-format JSON, relative to the project folder"
      />
      <div>
        <Button onClick={() => void launchService("comfy")}>Launch ComfyUI</Button>
      </div>
    </div>
  );
}
