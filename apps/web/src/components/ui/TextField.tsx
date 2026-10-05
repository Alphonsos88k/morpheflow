import { useId, type InputHTMLAttributes } from "react";

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  /** Small grey help text under the input. */
  hint?: string;
  onChange: (value: string) => void;
  /** Autocomplete options shown as you type; free text is still allowed. */
  suggestions?: { value: string; label?: string }[];
}

/** Labeled single-line input for forms (mostly Settings). */
export function TextField({
  label,
  hint,
  onChange,
  suggestions,
  className = "",
  ...rest
}: TextFieldProps) {
  const listId = useId();
  return (
    <label className={`flex flex-col gap-1.5 text-sm ${className}`}>
      <span className="text-[13px] font-medium text-muted">{label}</span>
      <input
        list={suggestions ? listId : undefined}
        className="border border-line bg-surface px-2.5 py-1.5 font-mono text-[13px] text-fg placeholder:text-muted/60 focus:border-accent focus:outline-none"
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s.value} value={s.value} label={s.label} />
          ))}
        </datalist>
      )}
      {hint && <span className="text-xs text-muted/80">{hint}</span>}
    </label>
  );
}
