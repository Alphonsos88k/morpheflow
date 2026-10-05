import { Button, Card } from "../../components/ui/index.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { runComfyStep } from "../run/runPipeline.ts";

/** Step 4: concept images from ComfyUI for the current prompt. */
export function ComfyStep() {
  const { session } = useSessionStore();
  const { status } = session.steps.comfy;
  const images = session.results.comfyImages;

  return (
    <Card
      title="ComfyUI images"
      actions={
        <Button
          onClick={() => void runComfyStep()}
          busy={status === "running"}
          disabled={!session.scene.prompt.trim()}
        >
          {images.length ? "Generate again" : "Generate"}
        </Button>
      }
    >
      {status === "outdated" && (
        <p className="text-xs text-warn">The prompt changed since these were made.</p>
      )}
      {status === "running" && <p className="text-sm text-muted">Generating…</p>}
      {images.length === 0 && status !== "running" && (
        <p className="text-sm text-muted">
          No images yet. Press Generate, or Build from the prompt with ComfyUI on.
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {images.map((src) => (
          <img key={src} src={src} alt="Generated concept" className="w-full border border-line" />
        ))}
      </div>
    </Card>
  );
}
