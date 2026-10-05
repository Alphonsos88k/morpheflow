import type { ReactNode } from "react";

export interface CardProps {
  title: string;
  /** Optional controls shown on the right of the title row (e.g. a Run button). */
  actions?: ReactNode;
  children: ReactNode;
}

/** Bordered panel with a small uppercase title, used for step content. */
export function Card({ title, actions, children }: CardProps) {
  return (
    <section className="flex flex-col gap-3 border border-line bg-surface p-4">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-semibold tracking-widest text-muted uppercase">{title}</h3>
        {actions}
      </header>
      {children}
    </section>
  );
}
