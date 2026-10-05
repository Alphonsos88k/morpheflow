export interface CloseButtonProps {
  onClick: () => void;
  /** Screen-reader label and tooltip. Defaults to "Close". */
  label?: string;
  className?: string;
  /** "lg" for roomy dialog headers (e.g. Settings). Defaults to "md". */
  size?: "md" | "lg";
}

/**
 * The standard way to close/dismiss anything (pop-ups, toasts, cards): a small circle with a
 * centered ✕. On hover the border, the ✕, and a soft glow all turn crimson. Use this, never a bare "✕".
 */
export function CloseButton({
  onClick,
  label = "Close",
  className = "",
  size = "md",
}: CloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`inline-flex ${size === "lg" ? "size-8" : "size-6"} shrink-0 items-center justify-center rounded-full border border-line p-0 leading-none text-muted transition-[border-color,color,box-shadow] duration-100 hover:border-crit hover:text-crit hover:shadow-[0_0_0_3px] hover:shadow-crit/20 ${className}`}
    >
      {/*
        16px icon box: its offset from the edge (4px / 8px) stays a whole pixel at 100/125/150/200%
        Windows scaling, so the ✕ never lands on a half pixel and looks shifted. The ✕ itself is drawn
        symmetric around the box center.
      */}
      <svg viewBox="0 0 16 16" className="block size-4" aria-hidden="true">
        <path
          d={size === "lg" ? "M4.5 4.5l7 7M11.5 4.5l-7 7" : "M5 5l6 6M11 5l-6 6"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </button>
  );
}
