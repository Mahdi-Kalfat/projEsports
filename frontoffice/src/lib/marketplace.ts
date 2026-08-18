// Marketplace is gated behind a level requirement — brand-new accounts can't
// immediately list or buy, cutting down on low-effort/scam listings from
// throwaway accounts. Checked both in the UI (marketplace pages) and in the
// server actions themselves (submitListing/buyListing), since the UI gate
// alone wouldn't stop someone from calling the action directly.
export const MARKETPLACE_MIN_LEVEL = 25;
