const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["day", 86_400_000],
  ["hour", 3_600_000],
  ["minute", 60_000],
];

const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

/**
 * Short relative time, e.g. "just now", "5 minutes ago", "yesterday".
 * @param iso - ISO date string in the past.
 */
export function timeAgo(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  for (const [unit, ms] of UNITS) {
    if (elapsed >= ms) return formatter.format(-Math.floor(elapsed / ms), unit);
  }
  return "just now";
}
