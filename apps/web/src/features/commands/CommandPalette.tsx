import { useMemo, useState, type KeyboardEvent } from "react";
import { Kbd, Modal } from "../../components/ui/index.ts";
import { keyLabel } from "../../constants/keybinds.ts";
import { useUiStore } from "../../stores/uiStore.ts";
import type { Command } from "./useCommands.ts";

export interface CommandPaletteProps {
  commands: Command[];
}

/** Ctrl+K: type to filter every command, ↑/↓ to move, Enter to run, Esc to close. */
export function CommandPalette({ commands }: CommandPaletteProps) {
  const { paletteOpen: open, setPaletteOpen } = useUiStore();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const matches = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return commands.filter(
      (c) =>
        c.id !== "palette" && words.every((w) => `${c.group} ${c.title}`.toLowerCase().includes(w)),
    );
  }, [commands, query]);

  const close = () => {
    setPaletteOpen(false);
    setQuery("");
    setActive(0);
  };
  const run = (command: Command | undefined) => {
    if (!command) return;
    close();
    command.run();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, matches.length - 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
    else if (e.key === "Enter") run(matches[active]);
    else return;
    e.preventDefault();
  };

  return (
    <Modal open={open} onClose={close} title="Commands" widthClass="max-w-lg" soft>
      <div className="flex flex-col gap-3">
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          className="rounded-md border border-line bg-surface-2 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <ul role="listbox" className="flex max-h-80 flex-col overflow-y-auto">
          {matches.map((c, i) => (
            <li
              key={c.id}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => run(c)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-1.5 text-sm ${
                i === active ? "bg-accent/15 text-fg" : "text-muted"
              }`}
            >
              <span>
                <span className="mr-2 text-[11px] text-muted/70">{c.group}</span>
                {c.title}
              </span>
              {c.combo && <Kbd>{keyLabel(c.combo)}</Kbd>}
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted">No matching command.</li>
          )}
        </ul>
      </div>
    </Modal>
  );
}
