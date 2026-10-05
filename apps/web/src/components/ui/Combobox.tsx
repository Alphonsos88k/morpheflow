import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

export interface ComboboxOption {
  value: string;
  /** Shown next to the value, e.g. a model's display name. */
  label?: string;
}

export interface ComboboxProps {
  /** Visible label above the field; omit inside tables (then `ariaLabel` names it). */
  label?: string;
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  /** Small grey help text under the input. */
  hint?: string;
}

/** Height of the open list (max-h-64); used to decide whether it fits below the input. */
const LIST_HEIGHT_PX = 256;

/**
 * Bottom edge of the nearest scrolling ancestor (or the window), so the list can open upward
 * instead of being cut off inside a scroll box like the Settings panel.
 */
function visibleBottom(el: HTMLElement): number {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const overflow = getComputedStyle(node).overflowY;
    if (overflow === "auto" || overflow === "scroll") return node.getBoundingClientRect().bottom;
  }
  return window.innerHeight;
}

/** Most options rendered at once; typing narrows the list. Keeps huge lists (300+ models) fast. */
const MAX_VISIBLE = 50;

/**
 * Searchable dropdown: opens on click/focus, filters as you type, still accepts free text.
 * Keys: ↑/↓ move, Enter picks, Esc closes.
 */
export function Combobox({
  label,
  ariaLabel,
  value,
  onChange,
  options,
  placeholder,
  hint,
}: ComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [openUp, setOpenUp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? options.filter(
          (o) => o.value.toLowerCase().includes(q) || o.label?.toLowerCase().includes(q),
        )
      : options;
  }, [options, query]);
  const visible = matches.slice(0, MAX_VISIBLE);

  const openList = () => {
    const input = inputRef.current;
    if (input)
      setOpenUp(input.getBoundingClientRect().bottom + LIST_HEIGHT_PX > visibleBottom(input));
    setQuery("");
    setActive(0);
    setOpen(true);
  };
  const pick = (option: ComboboxOption) => {
    onChange(option.value);
    setOpen(false);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && e.key === "ArrowDown") return openList();
    if (!open) return;
    if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, visible.length - 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
    else if (e.key === "Enter" && visible[active]) pick(visible[active]);
    else if (e.key === "Escape") setOpen(false);
    else return;
    // Handled here: keep Enter/Esc from also closing the dialog or saving.
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <label className="relative flex flex-col gap-1.5 text-sm">
      {label && <span className="text-[13px] font-medium text-muted">{label}</span>}
      <input
        ref={inputRef}
        role="combobox"
        aria-label={ariaLabel ?? label}
        aria-expanded={open}
        aria-controls={listId}
        value={value}
        placeholder={placeholder}
        onFocus={openList}
        onClick={() => !open && openList()}
        onBlur={() => setOpen(false)}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
        className="border border-line bg-surface px-2.5 py-1.5 font-mono text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
      />
      {open && visible.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute z-50 max-h-64 ${openUp ? "bottom-full mb-1" : "top-full mt-1"} w-full animate-fade-in overflow-y-auto border border-line bg-surface-2 py-1 shadow-xl`}
        >
          {visible.map((o, i) => (
            <li
              key={o.value}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input doesn't blur and close the list first.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(o);
              }}
              onMouseEnter={() => setActive(i)}
              className={`flex cursor-pointer items-baseline justify-between gap-3 px-2.5 py-1 ${i === active ? "bg-accent/15 text-fg" : "text-muted"}`}
            >
              <span className="truncate font-mono text-[12px]">{o.value}</span>
              {o.label && (
                <span className="shrink-0 truncate text-[11px] opacity-70">{o.label}</span>
              )}
            </li>
          ))}
          {matches.length > MAX_VISIBLE && (
            <li className="px-2.5 py-1 text-[11px] text-muted/70">
              +{matches.length - MAX_VISIBLE} more, keep typing to narrow
            </li>
          )}
        </ul>
      )}
      {hint && <span className="text-xs text-muted/80">{hint}</span>}
    </label>
  );
}
