import {
  KEYLESS_MODEL_LISTS,
  LLM_TASK_INFO,
  LLM_TASKS,
  PROVIDER_LABELS,
  PROVIDERS,
  type ModelCatalog,
  type Provider,
} from "@morpheflow/spec";
import { Button, Combobox, Select } from "../../../components/ui/index.ts";
import { timeAgo } from "../../../lib/time.ts";
import { useModelStore } from "../../../stores/modelStore.ts";
import { ApiKeysBar } from "../ApiKeysBar.tsx";
import { SectionTitle } from "./SectionTitle.tsx";
import type { AiSectionProps } from "./types.ts";

/** Job · Provider · Model columns, shared by the header row and every job row. */
const GRID = "grid grid-cols-[11rem_11rem_1fr] items-center gap-3";

/** API keys (pill bar) and a calm table of which provider + model runs each AI job. */
export function AiModelsSection({ draft, setDraft, keys, setKeys }: AiSectionProps) {
  const { catalog, refresh, refreshing } = useModelStore();

  return (
    <div className="flex flex-col gap-9">
      <ApiKeysBar keysSet={draft.llm.keysSet} keys={keys} setKeys={setKeys} />

      <section className="flex flex-col gap-4">
        <SectionTitle
          title="Model per job"
          aside={
            <>
              <span className="text-xs text-muted/70">{catalog && lastRefreshed(catalog)}</span>
              <Button
                size="sm"
                onClick={() => void refresh()}
                busy={refreshing}
                title="Downloads the providers' model lists. Free: no AI tokens used. Also runs once each time the app starts."
              >
                ↻ Refresh
              </Button>
            </>
          }
        />

        <div className="flex flex-col">
          <div
            className={`${GRID} border-b border-line pb-2 text-[10px] font-semibold tracking-[0.14em] text-muted/70 uppercase`}
          >
            <span>Job</span>
            <span>Provider</span>
            <span>Model</span>
          </div>
          {LLM_TASKS.map((task) => {
            const choice = draft.llm.tasks[task] ?? { provider: "anthropic", model: "" };
            const setChoice = (next: typeof choice) =>
              setDraft({
                ...draft,
                llm: { ...draft.llm, tasks: { ...draft.llm.tasks, [task]: next } },
              });
            const options =
              catalog?.models[choice.provider].map((m) => ({ value: m.id, label: m.name })) ?? [];
            const info = LLM_TASK_INFO[task];
            return (
              <div key={task} className={`${GRID} border-b border-line/50 py-3`}>
                <span className="flex flex-col">
                  <span className="text-[13px] font-medium text-fg">{info.label}</span>
                  <span className="text-[11px] text-muted/80">{info.hint}</span>
                </span>
                <Select
                  ariaLabel={`${info.label} provider`}
                  value={choice.provider}
                  options={PROVIDERS}
                  labels={PROVIDER_LABELS}
                  onChange={(provider) => setChoice({ ...choice, provider })}
                />
                <Combobox
                  ariaLabel={`${info.label} model`}
                  value={choice.model}
                  options={options}
                  placeholder="type or pick a model"
                  onChange={(model) => setChoice({ ...choice, model })}
                />
              </div>
            );
          })}
        </div>
        <SampleListNotice keysSet={draft.llm.keysSet} keys={keys} />
      </section>
    </div>
  );
}

/**
 * One quiet line naming providers whose model list is still the short built-in sample
 * (their list needs an API key). Hidden once every such provider has a key.
 */
function SampleListNotice({
  keysSet,
  keys,
}: Pick<AiSectionProps, "keys"> & { keysSet: Record<Provider, boolean> }) {
  const missing = PROVIDERS.filter(
    (p) => !KEYLESS_MODEL_LISTS.includes(p) && !keysSet[p] && !keys[p],
  );
  if (missing.length === 0) return null;
  return (
    <p className="text-[11px] leading-relaxed text-muted/80">
      <span className="text-warn">ⓘ</span> {missing.map((p) => PROVIDER_LABELS[p]).join(", ")} show
      a short sample list until you add their key.{" "}
      {KEYLESS_MODEL_LISTS.map((p) => PROVIDER_LABELS[p]).join(" and ")} list everything without
      one.
    </p>
  );
}

/**
 * "Last refreshed 5 minutes ago" from the most recent provider refresh, or "Never refreshed".
 * @param catalog - Current model catalog.
 */
function lastRefreshed(catalog: ModelCatalog): string {
  // ISO dates sort correctly as text.
  const latest = Object.values(catalog.updatedAt)
    .sort((a, b) => a.localeCompare(b))
    .at(-1);
  return latest ? `Refreshed ${timeAgo(latest)}` : "Never refreshed";
}
