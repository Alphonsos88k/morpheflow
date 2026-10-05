import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "subtle" | "ghost";
type Size = "md" | "sm";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. `primary` = the one main action on screen. Defaults to "subtle". */
  variant?: Variant;
  /** Shows a busy state and disables the button. */
  busy?: boolean;
  /** "sm" = compact, for notifications and dense rows. Defaults to "md". */
  size?: Size;
  /** Rounded and a little roomier, for the deliberately soft areas (prompt box row). Default: square. */
  soft?: boolean;
}

const SIZES: Record<Size, string> = {
  md: "gap-2 px-3 py-1.5 text-sm",
  sm: "gap-1.5 px-2 py-0.5 text-xs",
};

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:brightness-110",
  subtle: "bg-surface-2 text-fg border border-line hover:border-muted",
  ghost: "text-muted hover:text-fg hover:bg-surface-2",
};

/** Standard button used everywhere in the app. */
export function Button({
  variant = "subtle",
  busy = false,
  size = "md",
  soft = false,
  className = "",
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || busy}
      className={`inline-flex shrink-0 items-center font-medium whitespace-nowrap transition-[filter,border-color,color] duration-100 disabled:cursor-not-allowed disabled:opacity-50 ${soft ? "gap-2 rounded-lg px-4 py-2 text-sm" : SIZES[size]} ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {busy ? "…" : children}
    </button>
  );
}
