import { useEffect, useState } from "react";
import { PROVIDERS, type Provider, type PublicSettings } from "@morpheflow/spec";
import { ButtonGroup, GroupButton, Kbd, Modal } from "../../components/ui/index.ts";
import { KEYBINDS, keyLabel } from "../../constants/keybinds.ts";
import { useKeybind } from "../../hooks/useKeybind.ts";
import { useServiceStore } from "../../stores/serviceStore.ts";
import { useSettingsStore } from "../../stores/settingsStore.ts";
import { useUiStore } from "../../stores/uiStore.ts";
import { AiModelsSection } from "./sections/AiModelsSection.tsx";
import { BlenderSection } from "./sections/BlenderSection.tsx";
import { ComfySection } from "./sections/ComfySection.tsx";
import { GeneralSection } from "./sections/GeneralSection.tsx";

const SECTIONS = ["General", "AI models", "ComfyUI", "Blender"] as const;
type Section = (typeof SECTIONS)[number];

const NO_KEYS = Object.fromEntries(PROVIDERS.map((p) => [p, ""])) as Record<Provider, string>;

/**
 * Settings pop-up (cog wheel / Ctrl+,). Edits a local draft; nothing is saved until Save.
 * Footer keys on every page: Cancel (Esc, discards) · Save (Ctrl+Enter) · Save & close (Ctrl+Shift+Enter).
 */
export function SettingsPanel() {
  const { settingsOpen: open, setSettingsOpen } = useUiStore();
  const { settings, save, saving, load } = useSettingsStore();
  // Unsaved edits; null means "show what's saved".
  const [edits, setEdits] = useState<PublicSettings | null>(null);
  const [keys, setKeys] = useState(NO_KEYS);
  const [section, setSection] = useState<Section>("AI models");
  const draft = edits ?? settings;
  const dirty = edits !== null || Object.values(keys).some(Boolean);

  // Re-read on open, in case the settings file was edited by hand.
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const discardEdits = () => {
    setEdits(null);
    setKeys(NO_KEYS);
  };
  /** Cancel: close and throw away unsaved edits. */
  const close = () => {
    discardEdits();
    setSettingsOpen(false);
  };

  /** @returns true when saved. */
  const onSave = async (): Promise<boolean> => {
    if (!draft) return false;
    const ok = await save({
      app: draft.app,
      comfy: draft.comfy,
      blender: draft.blender,
      llm: { tasks: draft.llm.tasks, apiKeys: keys },
    });
    if (ok) {
      discardEdits();
      void useServiceStore.getState().refresh();
    }
    return ok;
  };
  const onSaveAndClose = async () => {
    if (await onSave()) setSettingsOpen(false);
  };
  useKeybind(KEYBINDS.saveSettings, () => void onSave(), open);
  useKeybind(KEYBINDS.saveAndCloseSettings, () => void onSaveAndClose(), open);

  const footer = draft && (
    <ButtonGroup variant="footer">
      <GroupButton size="lg" tone="cancel" onClick={close} title="Close without saving">
        Cancel <Kbd>Esc</Kbd>
      </GroupButton>
      <GroupButton size="lg" tone="accent" onClick={() => void onSave()} busy={saving}>
        {dirty && <span className="size-1.5 rounded-full bg-accent" aria-label="Unsaved changes" />}
        Save <Kbd>{keyLabel(KEYBINDS.saveSettings)}</Kbd>
      </GroupButton>
      <GroupButton size="lg" tone="primary" onClick={() => void onSaveAndClose()} busy={saving}>
        Save &amp; close <Kbd>{keyLabel(KEYBINDS.saveAndCloseSettings)}</Kbd>
      </GroupButton>
    </ButtonGroup>
  );

  return (
    <Modal open={open} onClose={close} title="Settings" widthClass="max-w-4xl" soft footer={footer}>
      {!draft ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        // Fixed height: switching sections never resizes the window; only the content scrolls.
        <div className="-m-6 flex h-[min(30rem,62vh)]">
          <nav className="flex w-48 shrink-0 flex-col gap-0.5 border-r border-line py-5">
            {SECTIONS.map((s) => {
              const current = s === section;
              return (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`relative px-6 py-2.5 text-left text-[13px] transition-[background-color,color] duration-150 ${
                    current
                      ? "bg-gradient-to-r from-accent/12 to-transparent font-medium text-fg"
                      : "text-muted hover:bg-surface-2 hover:text-fg"
                  }`}
                >
                  {/* Same sliding accent bar as the step rail. */}
                  <span
                    className={`absolute inset-y-0 left-0 w-0.5 transition-transform duration-200 ${
                      current
                        ? "scale-y-100 bg-accent shadow-[0_0_10px] shadow-accent/60"
                        : "scale-y-0"
                    }`}
                  />
                  {s}
                </button>
              );
            })}
          </nav>
          <div className="min-w-0 flex-1 overflow-y-auto py-6 pr-6 pl-10 [scrollbar-gutter:stable]">
            {section === "General" && <GeneralSection draft={draft} setDraft={setEdits} />}
            {section === "AI models" && (
              <AiModelsSection draft={draft} setDraft={setEdits} keys={keys} setKeys={setKeys} />
            )}
            {section === "ComfyUI" && <ComfySection draft={draft} setDraft={setEdits} />}
            {section === "Blender" && <BlenderSection draft={draft} setDraft={setEdits} />}
          </div>
        </div>
      )}
    </Modal>
  );
}
