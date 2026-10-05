import { useEffect, useRef, type ReactNode } from "react";
import { CloseButton } from "./CloseButton.tsx";

export interface ModalProps {
  open: boolean;
  /** Called on Esc, backdrop click, or the close button. */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Tailwind max-width class. Defaults to "max-w-md". */
  widthClass?: string;
  /**
   * Soft, plush variant (rounded, roomier header, larger ✕) for the deliberately soft surfaces:
   * the command palette and Settings. Default: square and compact.
   */
  soft?: boolean;
  /** Action strip sitting flush with the bottom/side edges (e.g. a footer ButtonGroup). */
  footer?: ReactNode;
}

/**
 * Base pop-up for the whole app. Uses the native <dialog>, which gives focus trapping
 * and Esc handling for free.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-md",
  soft = false,
  footer,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Let React state decide when to close, instead of the browser.
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto w-full ${widthClass} animate-fade-in border border-line bg-surface p-0 text-fg shadow-[0_24px_64px_-16px_rgb(0_0_0/0.7)] ${
        soft ? "overflow-hidden rounded-xl" : ""
      }`}
    >
      {open && (
        <div className="flex flex-col">
          <header
            className={`flex items-center justify-between border-b border-line ${soft ? "px-6 py-4" : "px-4 py-2"}`}
          >
            <h2
              className={`font-semibold text-muted uppercase ${
                soft ? "text-xs tracking-[0.18em]" : "text-[11px] tracking-[0.14em]"
              }`}
            >
              {title}
            </h2>
            <CloseButton onClick={onClose} size={soft ? "lg" : "md"} />
          </header>
          <div className={soft ? "p-6" : "p-4"}>{children}</div>
          {footer}
        </div>
      )}
    </dialog>
  );
}
