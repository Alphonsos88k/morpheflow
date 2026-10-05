import type { ReactNode } from "react";

export interface SectionTitleProps {
  title: string;
  /** Optional controls on the right (e.g. a Refresh button). */
  aside?: ReactNode;
}

/** Small uppercase heading for a group inside a Settings page, with optional controls on the right. */
export function SectionTitle({ title, aside }: SectionTitleProps) {
  return (
    <div className="flex min-h-7 items-center justify-between gap-3">
      <h4 className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{title}</h4>
      {aside && <div className="flex items-center gap-3">{aside}</div>}
    </div>
  );
}
