import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ButtonGroupProps {
  children: ReactNode;
  /** "footer" = full-width strip under a divider at the bottom of a card/dialog. */
  variant?: "inline" | "footer";
  className?: string;
}

/**
 * Segmented row of buttons joined by thin grey dividers, like piano keys (ui_style.md).
 * Use `variant="footer"` for a card's or dialog's action strip: divider on top, keys share the
 * full width and sit flush with the edges.
 */
export function ButtonGroup({ children, variant = "inline", className = "" }: ButtonGroupProps) {
  const frame = variant === "footer" ? "border-t border-line" : "border border-line";
  return <div className={`flex divide-x divide-line ${frame} ${className}`}>{children}</div>;
}

/** Each key's color job (ui_style.md §4). */
export type GroupButtonTone = "default" | "quiet" | "cancel" | "accent" | "primary";

const TONES: Record<GroupButtonTone, string> = {
  default: "text-fg/90 hover:bg-surface hover:text-fg",
  quiet: "text-muted hover:bg-surface hover:text-fg",
  /** Cancel / discard: quiet, crimson on hover. */
  cancel: "text-muted hover:bg-crit/10 hover:text-crit",
  /** Secondary positive action (e.g. Save). */
  accent: "text-accent hover:bg-accent/10",
  /** The main action (e.g. Save & close): solid accent. */
  primary: "bg-accent text-accent-fg hover:brightness-110",
};

export interface GroupButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Color job of this key. Defaults to "default". */
  tone?: GroupButtonTone;
  /** Shorthand for tone="quiet" (secondary actions like Not now). */
  quiet?: boolean;
  /** "lg" = taller keys for dialog footers. Defaults to "md". */
  size?: "md" | "lg";
  busy?: boolean;
}

/**
 * One key in a ButtonGroup. Hover lifts it (soft shadow below); press sinks it.
 * Never wraps or shrinks.
 */
export function GroupButton({
  tone,
  quiet,
  size = "md",
  busy,
  disabled,
  className = "",
  children,
  ...rest
}: GroupButtonProps) {
  const color = TONES[tone ?? (quiet ? "quiet" : "default")];
  const sizing = size === "lg" ? "py-3.5 text-sm" : "py-2 text-xs";
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`relative inline-flex flex-1 items-center justify-center gap-2 px-4 font-medium whitespace-nowrap transition-[background-color,color,box-shadow,transform,filter] duration-100 hover:z-10 hover:shadow-[0_3px_8px_-2px_rgb(0_0_0/0.55)] active:translate-y-px active:shadow-[inset_0_2px_4px_rgb(0_0_0/0.45)] disabled:cursor-not-allowed disabled:opacity-50 ${sizing} ${color} ${className}`}
      {...rest}
    >
      {busy ? "…" : children}
    </button>
  );
}
