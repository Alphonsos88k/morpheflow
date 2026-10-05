import { Button, Kbd, Toggle } from "../../components/ui/index.ts";
import { KEYBINDS, keyLabel } from "../../constants/keybinds.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { isRunning, runPipeline } from "../run/runPipeline.ts";

/**
 * Step 1, the home screen: one prompt box, step toggles, and Build.
 * `Enter` builds, `Shift+Enter` adds a line. Toggles mirror the step rail's switches.
 */
export function PromptBox() {
  const { session, setPrompt, toggleStep } = useSessionStore();
  const prompt = session.scene.prompt;
  const busy = isRunning(session.steps);

  const submit = () => {
    if (prompt.trim() && !busy) void runPipeline();
  };

  return (
    <div className="flex flex-col gap-3">
      <textarea
        autoFocus
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Describe a scene… e.g. anthro bipedal tiger man, minecraft dungeons look"
        className="w-full resize-none rounded-xl border border-line bg-surface px-4 py-3 font-mono text-[15px] leading-relaxed placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Toggle
          soft
          label="Clarify"
          checked={session.steps.clarify.enabled}
          onChange={() => toggleStep("clarify")}
          title="Clarify questions arrive in Stage 3"
        />
        <Toggle
          soft
          label="ComfyUI"
          checked={session.steps.comfy.enabled}
          onChange={() => toggleStep("comfy")}
          shortcut={keyLabel(KEYBINDS.toggleComfy)}
        />
        <Toggle
          soft
          label="Export"
          checked={session.steps.export.enabled}
          onChange={() => toggleStep("export")}
          title="Export arrives in Stage 3"
        />
        <Button
          soft
          variant="primary"
          className="ml-auto"
          onClick={submit}
          busy={busy}
          disabled={!prompt.trim()}
        >
          Build <Kbd>Enter</Kbd>
        </Button>
      </div>
    </div>
  );
}
