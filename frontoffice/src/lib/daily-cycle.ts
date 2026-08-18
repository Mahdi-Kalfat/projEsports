// Shared "once per UTC calendar day" logic for both the Lucky Wheel and the
// Daily Reward ladder — a fixed day boundary (not a rolling 24h window) so
// "already done today" / "one day later" are unambiguous, easy to test, and
// don't creep later each time someone claims a bit later than the day before.
function toUtcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

// Whole UTC calendar days between `from` and `to` (positive when `to` is
// later). 0 = same day, 1 = the very next day, 2+ = at least one day skipped.
export function utcDayDiff(from: Date, to: Date): number {
  return toUtcDayNumber(to) - toUtcDayNumber(from);
}

export function nextUtcMidnight(from: Date): Date {
  return new Date((toUtcDayNumber(from) + 1) * 86_400_000);
}
