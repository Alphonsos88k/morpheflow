import { Button, Card } from "../../components/ui/index.ts";
import { useSessionStore } from "../../stores/sessionStore.ts";
import { runBuildStep } from "../run/runPipeline.ts";

/** Step 7: the Blender agent's log and summary, plus the .blend backups made before each run. */
export function BuildStep() {
  const { session } = useSessionStore();
  const { status } = session.steps.build;
  const { buildSteps, buildText, blendVersions } = session.results;

  return (
    <Card
      title="Blender build"
      actions={
        <Button
          onClick={() => void runBuildStep()}
          busy={status === "running"}
          disabled={!session.scene.prompt.trim()}
        >
          {buildText ? "Build again" : "Build"}
        </Button>
      }
    >
      {status === "outdated" && (
        <p className="text-xs text-warn">The prompt changed since this build.</p>
      )}
      {status === "running" && (
        <p className="text-sm text-muted">The agent is working in Blender…</p>
      )}
      {!buildText && status !== "running" && (
        <p className="text-sm text-muted">Nothing built yet.</p>
      )}
      {buildSteps.length > 0 && (
        <ol className="flex flex-col gap-1 font-mono text-xs text-muted">
          {buildSteps.map((s, i) => (
            // Steps are an append-only log, so the index is a stable key.
            <li key={i} className="truncate">
              <span className="text-accent">{s.tool}</span> {s.summary}
            </li>
          ))}
        </ol>
      )}
      {buildText && <p className="text-sm">{buildText}</p>}
      {blendVersions.length > 0 && (
        <p className="text-xs text-muted/80" title={blendVersions.join("\n")}>
          {blendVersions.length} backup{blendVersions.length > 1 ? "s" : ""} saved before AI runs ·
          latest: <span className="font-mono">{blendVersions.at(-1)?.split("/").at(-1)}</span>
        </p>
      )}
    </Card>
  );
}
