import { useEffect } from "react";
import { Backdrop } from "./components/layout/Backdrop.tsx";
import { StatusBar } from "./components/layout/StatusBar.tsx";
import { StepRail } from "./components/layout/StepRail.tsx";
import { TopBar } from "./components/layout/TopBar.tsx";
import { ErrorBoundary, Toaster } from "./components/ui/index.ts";
import { CommandPalette } from "./features/commands/CommandPalette.tsx";
import { useCommandKeybinds } from "./features/commands/useCommandKeybinds.ts";
import { useCommands } from "./features/commands/useCommands.ts";
import { watchServices } from "./features/services/watchServices.ts";
import { useAutosave } from "./features/session/useAutosave.ts";
import { SettingsPanel } from "./features/settings/SettingsPanel.tsx";
import { SetupCards } from "./features/setup/SetupCards.tsx";
import { StepView } from "./features/steps/StepView.tsx";
import { startServicePolling } from "./stores/serviceStore.ts";
import { useSettingsStore } from "./stores/settingsStore.ts";
import { startSetupChecks, useSetupStore } from "./stores/setupStore.ts";
import { useUiStore } from "./stores/uiStore.ts";

export function App() {
  const commands = useCommands();
  const modalOpen = useUiStore((s) => s.paletteOpen || s.settingsOpen);
  useCommandKeybinds(commands, !modalOpen);
  useAutosave();

  useEffect(() => {
    void useSettingsStore.getState().load();
    const stopWatching = watchServices();
    const stopPolling = startServicePolling();
    const stopSetupChecks = startSetupChecks();
    // Paths may have changed in Settings: look again right away.
    const stopSettingsWatch = useSettingsStore.subscribe((s, prev) => {
      if (prev.settings && s.settings !== prev.settings) void useSetupStore.getState().check();
    });
    return () => {
      stopWatching();
      stopPolling();
      stopSetupChecks();
      stopSettingsWatch();
    };
  }, []);

  return (
    <div className="flex h-full flex-col">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        <StepRail />
        {/* The backdrop stays put; only the content above it scrolls. */}
        <div className="relative min-w-0 flex-1">
          <Backdrop />
          <main className="relative h-full overflow-y-auto">
            <ErrorBoundary>
              <StepView />
            </ErrorBoundary>
          </main>
        </div>
      </div>
      <ErrorBoundary>
        <SettingsPanel />
      </ErrorBoundary>
      <CommandPalette commands={commands} />
      <SetupCards />
      <StatusBar />
      <Toaster />
    </div>
  );
}
