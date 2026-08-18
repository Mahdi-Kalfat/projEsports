export type RankDefault = { name: string; image: string };

// Mirrors frontoffice's lib/rank.ts DEFAULT_RANK_TIERS — the rank ladder's
// structure (tier count/order, which level band each belongs to) is a fixed
// constant in code on both sides, not stored in the DB. Only a tier's
// display (name/image) can be overridden here — see the RankTier model.
export const DEFAULT_RANK_TIERS: RankDefault[] = [
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
