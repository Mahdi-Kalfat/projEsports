// A restriction (ban/block/market-block/shop-block) is stored as a boolean flag
// plus an expiry timestamp. It's in effect only while the flag is set AND the
// expiry hasn't passed yet — there's no background job flipping the flag back;
// every reader (login check, table, modal) derives "is this active right now"
// from this same function, so the restriction lifts itself the moment it expires.
export function isRestrictionActive(active: boolean, until: Date | null): boolean {
  if (!active) return false;
  if (!until) return true;
  return until.getTime() > Date.now();
}

export type RestrictionKind = "ban" | "block" | "market" | "shop";

export const RESTRICTION_LABELS: Record<RestrictionKind, { apply: string; lift: string }> = {
  ban: { apply: "Ban", lift: "Unban" },
  block: { apply: "Block", lift: "Unblock" },
  market: { apply: "Block market", lift: "Unblock market" },
  shop: { apply: "Block shop", lift: "Unblock shop" },
};

// Past-tense phrasing for the audit log — distinct from RESTRICTION_LABELS above,
// which is imperative button text ("Ban" / "Unban").
export const RESTRICTION_LOG_LABELS: Record<RestrictionKind, { applied: string; lifted: string }> = {
  ban: { applied: "Banned", lifted: "Unbanned" },
  block: { applied: "Blocked", lifted: "Unblocked" },
  market: { applied: "Blocked from the marketplace", lifted: "Unblocked from the marketplace" },
  shop: { applied: "Blocked from the shop", lifted: "Unblocked from the shop" },
};

const DURATION_UNIT_MS: Record<string, number> = {
  hours: 60 * 60 * 1000,
  days: 24 * 60 * 60 * 1000,
  weeks: 7 * 24 * 60 * 60 * 1000,
};

export function durationToMs(amount: number, unit: string): number | null {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 3650) return null;
  const unitMs = DURATION_UNIT_MS[unit];
  if (!unitMs) return null;
  return amount * unitMs;
}
