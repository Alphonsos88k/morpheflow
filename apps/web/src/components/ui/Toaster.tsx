import { CloseButton } from "./CloseButton.tsx";
import { useToastStore, type ToastKind } from "./toastStore.ts";

const ACCENTS: Record<ToastKind, string> = {
  info: "border-l-muted",
  success: "border-l-ok",
  error: "border-l-bad",
};

/** Renders all active toasts in the bottom-right corner. Mount once in App. */
export function Toaster() {
  const { toasts, dismiss } = useToastStore();
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-96 flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={`pointer-events-auto flex animate-fade-in flex-col gap-2 border border-l-2 border-line bg-surface-2 px-4 py-3 text-sm shadow-xl ${ACCENTS[t.kind]}`}
        >
          <div className="flex items-start gap-3">
            <p className="flex-1 break-words">{t.message}</p>
            <CloseButton onClick={() => dismiss(t.id)} label="Dismiss" />
          </div>
          {t.actions && t.actions.length > 0 && (
            <div className="flex gap-3">
              {t.actions.map((a) => (
                <button
                  key={a.label}
                  className="font-medium text-accent hover:underline"
                  onClick={() => {
                    a.onClick();
                    dismiss(t.id);
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
