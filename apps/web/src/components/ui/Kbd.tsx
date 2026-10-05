import type { ReactNode } from "react";

/**
 * Quiet key hint placed after a label, e.g. <Button>Save <Kbd>Ctrl+Enter</Kbd></Button>.
 * A faint divider separates it from the label; the letters are softly embossed (`.kbd-bevel`).
 */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="kbd-bevel ml-0.5 border-l border-current/20 pl-2 font-mono text-[10px] font-normal tracking-tight opacity-50">
      {children}
    </kbd>
  );
}
