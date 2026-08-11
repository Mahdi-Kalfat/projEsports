export type Rank = {
  name: string;
  image: string;
};

// Every 5 levels is a rank; level N belongs to floor(N / 5) — e.g. levels 1-4 are
// Iron 1, level 5 starts Iron 2, level 90+ is Champion (no sub-tiers past Diamond 3).
const TIERS: Rank[] = [
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
];

const CHAMPION: Rank = { name: "Champion", image: "/ranks/champ.png" };

export function getRank(level: number): Rank {
  const index = Math.floor(Math.max(level, 1) / 5);
  return TIERS[index] ?? CHAMPION;
}
