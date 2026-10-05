import { STEP_DEFS, type StepId } from "@morpheflow/spec";
import { Card } from "../../components/ui/index.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { PromptBox } from "../prompt/PromptBox.tsx";
import { StepNav } from "../stepper/StepNav.tsx";
import { BuildStep } from "./BuildStep.tsx";
import { ComfyStep } from "./ComfyStep.tsx";

/** Screens for steps that exist so far. Adding a step = add its component here (+ READY_STEPS). */
const VIEWS: Partial<Record<StepId, () => React.JSX.Element>> = {
  prompt: PromptBox,
  comfy: ComfyStep,
  build: BuildStep,
};

/** Shows the current step's screen, or a placeholder for steps coming in Stage 3. */
export function StepView() {
  const current = useSessionStore((s) => s.session.currentStep);
  const enabled = useSessionStore((s) => s.session.steps[current].enabled);
  const View = VIEWS[current];
  const name = STEP_DEFS.find((s) => s.id === current)?.name ?? current;

  return (
    <div
      className={`mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-16 ${current === "prompt" ? "pt-[18vh]" : "pt-10"}`}
    >
      {!enabled && (
        <p className="text-xs text-muted">
          This step is switched off for this session. Its switch is on the step rail.
        </p>
      )}
      {View ? (
        <View />
      ) : (
        <Card title={name}>
          <p className="text-sm text-muted">
            This step arrives in Stage 3. You can already switch it on or off on the step rail.
          </p>
        </Card>
      )}
      <StepNav />
    </div>
  );
}
