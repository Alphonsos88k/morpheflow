import { useState } from "react";
import type { PublicSettings } from "@morpheflow/spec";
import { Button, PathField, TextField, toast } from "../../../components/ui/index.ts";
import { api, messageOf } from "../../../lib/api.ts";
import { PATH_FILTERS } from "../../../lib/pickPath.ts";
import { launchService } from "../../../lib/services.ts";
import { VersionRow } from "../VersionRow.tsx";
import type { SectionProps } from "./types.ts";

/** Blender path, MCP server command, and socket port. */
export function BlenderSection({ draft, setDraft }: SectionProps) {
  const [tools, setTools] = useState<string[] | null>(null);
  const set = (patch: Partial<PublicSettings["blender"]>) =>
    setDraft({ ...draft, blender: { ...draft.blender, ...patch } });

  const listTools = async () => {
    try {
      setTools((await api.get<{ tools: string[] }>("/blender/tools")).tools);
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <PathField
        kind="file"
        filter={PATH_FILTERS.exe}
        label="blender.exe path"
        value={draft.blender.exePath}
        onChange={(exePath) => set({ exePath })}
        placeholder="C:\Program Files\Blender Foundation\Blender 5.0\blender.exe"
        hint="Found automatically in the usual install folders when possible."
      />
      <VersionRow dep="blender" />
      <PathField
        kind="file"
        filter={PATH_FILTERS.exe}
        label="MCP server command"
        value={draft.blender.mcpCommand}
        onChange={(mcpCommand) => set({ mcpCommand })}
      />
      <TextField
        label="MCP server arguments"
        value={draft.blender.mcpArgs.join(" ")}
        onChange={(v) => set({ mcpArgs: v.split(" ").filter(Boolean) })}
      />
      <TextField
        label="Addon socket port"
        type="number"
        value={String(draft.blender.port)}
        onChange={(v) => set({ port: Number(v) })}
      />
      <TextField
        label="Agent step budget"
        type="number"
        value={String(draft.blender.stepBudget)}
        onChange={(v) => set({ stepBudget: Number(v) })}
        hint="Max tool calls per build"
      />
      <div className="flex gap-2">
        <Button onClick={() => void launchService("blender")}>Launch Blender</Button>
        <Button onClick={() => void listTools()}>List MCP tools</Button>
      </div>
      {tools && <p className="font-mono text-xs text-muted">{tools.join(", ") || "(no tools)"}</p>}
    </div>
  );
}
