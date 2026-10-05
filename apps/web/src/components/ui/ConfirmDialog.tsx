import { Button } from "./Button.tsx";
import { Kbd } from "./Kbd.tsx";
import { Modal } from "./Modal.tsx";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Question shown to the user. */
  message: string;
  /** Label of the confirm button. Defaults to "Confirm". */
  confirmLabel?: string;
  onConfirm: () => void;
  /** Called on Cancel or Esc. */
  onCancel: () => void;
}

/** Yes/no pop-up. `Enter` confirms (the confirm button has focus), `Esc` cancels. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-muted">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onCancel}>
          Cancel <Kbd>Esc</Kbd>
        </Button>
        <Button variant="primary" onClick={onConfirm} autoFocus>
          {confirmLabel} <Kbd>Enter</Kbd>
        </Button>
      </div>
    </Modal>
  );
}
