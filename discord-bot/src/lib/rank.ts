// Mirror of frontoffice/backoffice's lib/rank.ts (same pure functions, no DB
// access) — kept in sync manually, same as those two already mirror each
// other. Used by commands/profile.ts to show the caller's current rank name.
export type Rank = {
  name: string;
  image: string;
};

// The rank ladder's structure (level bands, tier count/order) is a fixed
// constant, not admin-configurable — only each tier's *display* (name/image)
// can be overridden (see RankOverride below and the back office's /ranks
// page).
export const DEFAULT_RANK_TIERS: Rank[] = [
  { name: "Iron 1", image: "/ranks/iron1.png" },
  { name: "Iron 2", image: "/ranks/iron2.png" },
  { name: "Iron 3", image: "/ranks/iron3.png" },
  { name: "Bronze 1", image: "/ranks/bronze1.png" },
  { name: "Bronze 2", image: "/ranks/bronze2.png" },
  { name: "Bronze 3", image: "/ranks/bronze3.png" },
  { name: "Silver 1", image: "/ranks/silver1.png" },
  { name: "Silver 2", image: "/ranks/silver2.png" },
  { name: "Silver 3", image: "/ranks/silver3.png" },
  { name: "Gold 1", image: "/ranks/gold1.png" },
  { name: "Gold 2", image: "/ranks/gold2.png" },
  { name: "Gold 3", image: "/ranks/gold3.png" },
  { name: "Platinum 1", image: "/ranks/plat1.png" },
  { name: "Platinum 2", image: "/ranks/plat2.png" },
  { name: "Platinum 3", image: "/ranks/plat3.png" },
  { name: "Diamond 1", image: "/ranks/dimond1.png" },
  { name: "Diamond 2", image: "/ranks/dimond2.png" },
  { name: "Diamond 3", image: "/ranks/dimond3.png" },
  { name: "Champion", image: "/ranks/champ.png" },
];

const MAX_TIER = DEFAULT_RANK_TIERS.length - 1;

// Every 5 levels is a rank; level N belongs to floor(N / 5), clamped to the
// last tier (Champion) once past it — e.g. levels 1-4 are Iron 1, level 5
// starts Iron 2, level 90+ is Champion.
export function tierForLevel(level: number): number {
  return Math.min(Math.floor(Math.max(level, 1) / 5), MAX_TIER);
}

// A RankTier row from the DB — present only for tiers an admin has actually
// customized.
export type RankOverride = { tier: number; name: string | null; imageUrl: string | null };

export function getRank(level: number, overrides: RankOverride[] = []): Rank {
  const tier = tierForLevel(level);
  const fallback = DEFAULT_RANK_TIERS[tier];
  const override = overrides.find((o) => o.tier === tier);
  return {
    name: override?.name || fallback.name,
    image: override?.imageUrl || fallback.image,
  };
}
