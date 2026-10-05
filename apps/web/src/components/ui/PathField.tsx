import { useState } from "react";
import type { PickPathRequest } from "@morpheflow/spec";
import { messageOf } from "../../lib/api.ts";
import { pickPath } from "../../lib/pickPath.ts";
import { Button } from "./Button.tsx";
import { TextField, type TextFieldProps } from "./TextField.tsx";
import { toast } from "./toastStore.ts";

const ICONS: Record<PickPathRequest["kind"], string> = { file: "📄", save: "💾", folder: "📁" };

export interface PathFieldProps extends Omit<TextFieldProps, "value"> {
  value: string;
  /** "file" = pick existing file (import), "save" = choose where to write (export), "folder" = pick a folder. */
  kind: PickPathRequest["kind"];
  /** Windows filter string; see PATH_FILTERS in lib/pickPath.ts. */
  filter?: string;
  /** Wrap picked paths containing spaces in quotes (for shell commands). */
  quote?: boolean;
  /** Folder the dialog opens in while the field is empty (relative to the project, or absolute). */
  startIn?: string;
}

/**
 * Text field + "Browse" button that opens the native Windows file/folder/save dialog.
 * Use this for every path input in the app (settings, imports, exports).
 */
export function PathField({
  value,
  kind,
  filter,
  quote,
  startIn,
  onChange,
  label,
  ...rest
}: PathFieldProps) {
  const [picking, setPicking] = useState(false);

  const browse = async () => {
    setPicking(true);
    try {
      const path = await pickPath({
        kind,
        title: label,
        filter,
        initialPath: value || startIn || "",
      });
      if (path) onChange(quote && path.includes(" ") ? `"${path}"` : path);
    } catch (err) {
      toast({ kind: "error", message: messageOf(err) });
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="flex items-start gap-2">
      <TextField className="flex-1" label={label} value={value} onChange={onChange} {...rest} />
      {/* mt-6 lines the button up with the input, below its label. */}
      <Button
        className="mt-[26px]"
        onClick={() => void browse()}
        busy={picking}
        title={kind === "save" ? "Choose where to save" : `Choose a ${kind}`}
      >
        {ICONS[kind]} Browse
      </Button>
    </div>
  );
}
