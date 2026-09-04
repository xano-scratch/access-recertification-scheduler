// Small display helpers. Timestamps come back as epoch milliseconds.

export const fmtDate = (ms?: number | null): string =>
  ms == null
    ? "—"
    : new Date(Number(ms)).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

export const fmtDateTime = (ms?: number | null): string =>
  ms == null ? "—" : new Date(Number(ms)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

/** Whole days from now until `ms` (negative when already past). */
export const daysFromNow = (ms?: number | null): number | null =>
  ms == null ? null : Math.round((Number(ms) - Date.now()) / 86_400_000);

/** A short "due in 12 days" / "overdue 30 days" phrase for a due timestamp. */
export const dueLabel = (ms?: number | null): string => {
  const d = daysFromNow(ms);
  if (d == null) return "—";
  if (d < 0) return `overdue ${Math.abs(d)}d`;
  if (d === 0) return "due today";
  return `due in ${d}d`;
};

export const titleCase = (s: string): string =>
  s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
