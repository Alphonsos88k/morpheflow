import { useState } from "react";
import { PROVIDER_LABELS, PROVIDERS, type LlmTestResponse, type Provider } from "@morpheflow/spec";
import { Button, StatusDot, toast } from "../../components/ui/index.ts";
import { api, messageOf } from "../../lib/api.ts";
import { SectionTitle } from "./sections/SectionTitle.tsx";

export interface ApiKeysBarProps {
  /** Which providers already have a saved key. */
  keysSet: Record<Provider, boolean>;
  /** New keys typed this session ("" = keep saved key). */
  keys: Record<Provider, string>;
  setKeys: (keys: Record<Provider, string>) => void;
}

/**
 * Compact API key editor: one pill per provider (light = key saved / typed),
 * click a pill to edit that key inline and test it.
 */
export function ApiKeysBar({ keysSet, keys, setKeys }: ApiKeysBarProps) {
  const [editing, setEditing] = useState<Provider | null>(null);
  const [testing, setTesting] = useState(false);

  const test = async (provider: Provider) => {
    setTesting(true);
    try {
      const res = await api.post<LlmTestResponse>(`/llm/test/${provider}`);
      toast(
        res.ok
          ? { kind: "success", message: `${PROVIDER_LABELS[provider]}: key works.` }
          : { kind: "error", message: res.error ?? "Failed" },
      );
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle title="API keys" />
      <div className="flex flex-wrap gap-1.5">
        {PROVIDERS.map((p) => (
          <button
            key={p}
            onClick={() => setEditing(editing === p ? null : p)}
            className={`border px-2.5 py-1 transition-colors duration-100 ${
              editing === p ? "border-accent/60 bg-accent/10" : "border-line hover:border-muted"
            }`}
          >
            <StatusDot
              label={PROVIDER_LABELS[p]}
              state={keys[p] || keysSet[p] ? "up" : "unknown"}
            />
          </button>
        ))}
      </div>
      {editing && (
        <div className="flex animate-fade-in items-center gap-2">
          <input
            autoFocus
            type="password"
            value={keys[editing]}
            onChange={(e) => setKeys({ ...keys, [editing]: e.target.value })}
            placeholder={
              keysSet[editing] ? "saved (type to replace)" : `${PROVIDER_LABELS[editing]} API key`
            }
            className="flex-1 border border-line bg-surface px-2.5 py-1.5 font-mono text-[13px] placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
          <Button onClick={() => void test(editing)} busy={testing} title="Save first, then test">
            Test
          </Button>
        </div>
      )}
    </div>
  );
}
