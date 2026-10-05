import { Kbd } from "./Kbd.tsx";

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Keyboard shortcut shown inside the pill, e.g. "Alt+2". */
  shortcut?: string;
  disabled?: boolean;
  /** Tooltip, e.g. why it's disabled. */
  title?: string;
  /** Rounded, roomier pill for the deliberately soft areas (prompt box row). Default: square. */
  soft?: boolean;
}

/** Pill-shaped on/off switch used for step toggles. */
export function Toggle({ label, checked, onChange, shortcut, disabled, title, soft }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      title={title}
      onClick={() => onChange(!checked)}
      className={`inline-flex items-center gap-2 border text-xs ${soft ? "rounded-full px-3.5 py-1.5" : "px-3 py-1"} transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "border-accent/60 bg-accent/10 text-fg" : "border-line text-muted hover:text-fg"
      }`}
    >
      <span className={`size-1.5 rounded-full ${checked ? "bg-accent" : "bg-line"}`} />
      {label}
      {shortcut && <Kbd>{shortcut}</Kbd>}
    </button>
  );
}
