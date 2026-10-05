import type { SetupDep } from "@morpheflow/spec";
import { Button } from "../../components/ui/index.ts";
import { timeAgo } from "../../lib/time.ts";
import { useSetupStore } from "../../stores/setupStore.ts";

/**
 * Sits under a program's path field: "Installed 4.2 · Newest 5.2.2 · checked 2 hours ago [Check now]".
 * Turns red when the install is too old to work, amber when a newer version exists.
 * The version is detected automatically and also saved in Settings (detectedVersion).
 */
export function VersionRow({ dep }: { dep: SetupDep }) {
  const { status, checkUpdates, checkingUpdates } = useSetupStore();
  const info = status?.[dep];
  const installed = info?.version ?? (info?.state === "ok" ? "unknown" : "not found");
  const newest = info?.latestVersion ?? "unknown";
  const checked = info?.latestCheckedAt
    ? `checked ${timeAgo(info.latestCheckedAt)}`
    : "never checked";

  const tooOld = info?.state === "too-old";
  let tone = "border-line";
  if (tooOld) tone = "border-bad/50 bg-bad/5";
  else if (info?.updateAvailable) tone = "border-warn/50 bg-warn/5";

  return (
    <div className={`flex flex-col gap-1.5 border px-3 py-2 text-xs ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted">
          Installed <span className="font-mono text-fg">{installed}</span> · Newest{" "}
          <span className="font-mono text-fg">{newest}</span> · {checked}
        </span>
        <Button onClick={() => void checkUpdates()} busy={checkingUpdates}>
          Check now
        </Button>
      </div>
      {(tooOld || info?.updateAvailable) && (
        <span className={tooOld ? "text-bad" : "text-warn"}>⚠ {info?.message}</span>
      )}
    </div>
  );
}
