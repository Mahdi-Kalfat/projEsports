// Mirror of frontoffice's lib/daily-cycle.ts — same "once per UTC calendar
// day" logic used by /daily and /spin, so a claim/spin made here and one
// made on the site agree about what "today" means. See the frontoffice
// file's comment for why this is a fixed day boundary, not a rolling 24h
// window.
function toUtcDayNumber(date: Date): number {
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000);
}

export function utcDayDiff(from: Date, to: Date): number {
  return toUtcDayNumber(to) - toUtcDayNumber(from);
}
