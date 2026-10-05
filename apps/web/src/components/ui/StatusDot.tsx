import type { CSSProperties } from "react";
import type { ServiceState } from "@morpheflow/spec";

/** Light color per state; drawn by `.status-socket` / `.status-led` in index.css. */
const LED_COLORS: Record<ServiceState, string> = {
  up: "var(--color-ok)",
  starting: "var(--color-warn)",
  down: "var(--color-bad)",
  unknown: "var(--color-muted)",
};

export interface StatusDotProps {
  /** Service name shown next to the indicator. */
  label: string;
  state: ServiceState;
}

/** Radio-style status light: a recessed ring (socket) with a glossy, glowing light centered inside. */
export function StatusDot({ label, state }: StatusDotProps) {
  const style = { "--led": LED_COLORS[state] } as CSSProperties;
  return (
    <span
      className="inline-flex items-center gap-2 text-xs text-muted"
      title={`${label}: ${state}`}
    >
      <span className="status-socket" style={style}>
        <span className={`status-led ${state === "starting" ? "animate-pulse" : ""}`} />
      </span>
      {label}
    </span>
  );
}
