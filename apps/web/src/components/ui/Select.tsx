export interface SelectProps<T extends string> {
  /** Visible label above the field; omit inside tables (then `ariaLabel` names it). */
  label?: string;
  ariaLabel?: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** Display text per option; defaults to the value itself. */
  labels?: Partial<Record<T, string>>;
}

/** Labeled dropdown for a fixed list of string options. */
export function Select<T extends string>({
  label,
  ariaLabel,
  value,
  options,
  onChange,
  labels,
}: SelectProps<T>) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      {label && <span className="text-[13px] font-medium text-muted">{label}</span>}
      <select
        aria-label={ariaLabel ?? label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="border border-line bg-surface px-2 py-1.5 text-[13px] text-fg focus:border-accent focus:outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {labels?.[o] ?? o}
          </option>
        ))}
      </select>
    </label>
  );
}
