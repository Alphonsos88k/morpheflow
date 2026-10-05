import { useState } from "react";
import { SETUP_DEPS, type DepStatus, type SetupDep, type SetupState } from "@morpheflow/spec";
import { ButtonGroup, CloseButton, GroupButton, toast } from "../../components/ui/index.ts";
import { messageOf } from "../../lib/api.ts";
import { PATH_FILTERS, pickPath } from "../../lib/pickPath.ts";
import { useSettingsStore } from "../../stores/settingsStore.ts";
import { useSetupStore } from "../../stores/setupStore.ts";

/** Card titles; "ok" means found but an update is available (ok cards only show then). */
const TITLES: Record<SetupDep, Record<SetupState, string>> = {
  blender: {
    missing: "Blender not found",
    "too-old": "Blender is too old",
    moved: "Blender moved",
    ok: "Blender update available",
  },
  comfy: {
    missing: "ComfyUI not found",
    "too-old": "ComfyUI is too old",
    moved: "ComfyUI moved",
    ok: "ComfyUI update available",
  },
};

/** A card is needed when the program isn't usable, or works but is older than the newest release. */
const needsCard = (info: DepStatus) => info.state !== "ok" || info.updateAvailable;

/**
 * Small cards in the bottom-left corner when Blender or ComfyUI is missing, too old, has moved,
 * or is older than the newest official release.
 * Not a splash screen: the app stays usable. Each card offers Locate (Browse), Download page,
 * Not now (until reload), and Don't ask again (Settings → General → Setup checks turns it back on).
 */
export function SetupCards() {
  const { status, snoozed } = useSetupStore();
  const checks = useSettingsStore((s) => s.settings?.app.setupChecks);
  if (!status || !checks) return null;

  const visible = SETUP_DEPS.filter(
    (dep) => needsCard(status[dep]) && checks[dep] && !snoozed.includes(dep),
  );
  if (visible.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 flex w-[460px] flex-col gap-2">
      {visible.map((dep) => (
        <SetupCard key={dep} dep={dep} />
      ))}
    </div>
  );
}

/** One program's card with its four actions. */
function SetupCard({ dep }: { dep: SetupDep }) {
  const { status, check, snooze } = useSetupStore();
  const { settings, save } = useSettingsStore();
  const [locating, setLocating] = useState(false);
  const info = status?.[dep];
  if (!info || !needsCard(info) || !settings) return null;

  const locate = async () => {
    setLocating(true);
    try {
      const picked =
        dep === "blender"
          ? await pickPath({
              kind: "file",
              title: "Find blender.exe",
              filter: PATH_FILTERS.exe,
              initialPath: info.path ?? "",
            })
          : await pickPath({
              kind: "folder",
              title: "Find your ComfyUI folder",
              initialPath: info.path ?? "",
            });
      if (!picked) return;
      const ok = await save(
        dep === "blender"
          ? { blender: { exePath: picked } }
          : { comfy: { workingDir: picked, launchCommand: "" } },
      );
      if (ok) await check();
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    } finally {
      setLocating(false);
    }
  };

  const neverAsk = async () => {
    const ok = await save({ app: { setupChecks: { ...settings.app.setupChecks, [dep]: false } } });
    if (ok)
      toast({
        kind: "info",
        message: "Hidden for good. Turn it back on in Settings → General → Setup checks.",
      });
  };

  return (
    <section
      aria-label={TITLES[dep][info.state]}
      className="flex animate-fade-in flex-col border border-l-2 border-line border-l-warn bg-surface-2 shadow-[0_12px_32px_-8px_rgb(0_0_0/0.6)]"
    >
      <div className="flex items-start gap-2.5 px-3.5 pt-3 pb-3">
        <span className="mt-px text-[15px] leading-none text-warn" aria-hidden="true">
          ⚠
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="text-[15px] leading-tight font-semibold text-warn">
              {TITLES[dep][info.state]}
            </h3>
            {info.latestVersion && (
              <span className="border border-line px-1 font-mono text-[10px] text-muted">
                newest {info.latestVersion}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs leading-snug font-medium text-fg/75 italic">{info.message}</p>
        </div>
        <CloseButton onClick={() => snooze(dep)} label="Not now" />
      </div>
      {/* Footer: full-width divider + segmented "piano key" actions. */}
      <ButtonGroup variant="footer">
        <GroupButton onClick={() => void locate()} busy={locating}>
          📁 Locate…
        </GroupButton>
        <GroupButton onClick={() => window.open(info.downloadUrl, "_blank", "noopener")}>
          ↗ Download page
        </GroupButton>
        <GroupButton quiet onClick={() => snooze(dep)}>
          Not now
        </GroupButton>
        <GroupButton quiet onClick={() => void neverAsk()}>
          Don&apos;t ask again
        </GroupButton>
      </ButtonGroup>
    </section>
  );
}
