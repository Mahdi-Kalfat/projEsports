// A restriction (ban/block/market-block/shop-block) is stored as a boolean flag
// plus an expiry timestamp. It's in effect only while the flag is set AND the
// expiry hasn't passed yet — mirrors backoffice/src/lib/restrictions.ts exactly,
// since both apps read the same User rows and must agree on what "active" means.
export function isRestrictionActive(active: boolean, until: Date | null): boolean {
  if (!active) return false;
  if (!until) return true;
  return until.getTime() > Date.now();
}
