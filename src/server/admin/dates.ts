/**
 * Admin date inputs are plain calendar dates interpreted in India Standard Time,
 * so the result never depends on the server's or browser's time zone.
 */
const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" });

/** Date → "YYYY-MM-DD" (IST) for `<input type="date">`. */
export function toDateInput(value: Date | null | undefined) {
  return value ? ymd.format(value) : "";
}

/** "YYYY-MM-DD" → Date at the start (00:00) or end (23:59:59) of that IST day. */
export function fromDateInput(value: string, edge: "start" | "end") {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T${edge === "start" ? "00:00:00" : "23:59:59"}+05:30`);
  return Number.isNaN(d.getTime()) ? null : d;
}

