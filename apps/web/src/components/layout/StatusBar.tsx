import { PROVIDER_LABELS, type ActiveModel } from "@morpheflow/spec";
import { StatusDot } from "../ui/index.ts";
import { useServiceStore } from "../../stores/serviceStore.ts";

/**
 * Status label for the AI model, e.g. "Claude Opus 5.5 · Anthropic" or "GPT-5 · OpenAI via OpenRouter".
 * @param model - Active model, or null when not connected (shows plain "AI").
 */
function aiLabel(model: ActiveModel | null): string {
  if (!model) return "AI";
  const provider = PROVIDER_LABELS[model.provider];
  return model.publisher === provider
    ? `${model.name} · ${provider}`
    : `${model.name} · ${model.publisher} via ${provider}`;
}

/** Small service-status pill tucked top-right, just under the settings cog; one divider between services. */
export function StatusBar() {
  const health = useServiceStore((s) => s.health);
  return (
    <div
      className="fixed top-14 right-4 z-40 flex h-10 items-center divide-x divide-line rounded-full border border-line bg-surface/80 px-2 shadow-lg backdrop-blur-sm [&>*]:px-3.5"
      role="status"
      aria-label="Service status"
    >
      <StatusDot label={aiLabel(health.llmModel)} state={health.llm} />
      <StatusDot label="ComfyUI" state={health.comfy} />
      <StatusDot label="Blender" state={health.blender} />
    </div>
  );
}
