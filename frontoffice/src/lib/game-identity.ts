// Per-game accent + logo (design plan §12) — one platform, three worlds. Keyed
// by the game's display name since that's what card data already carries
// (tournament.gameName, event.gameName, etc.), not a separate slug lookup.
export type GameIdentity = {
  accent: string;
  logo: string | null;
};

const IDENTITIES: Record<string, GameIdentity> = {
  valorant: { accent: "#FF1E3C", logo: "/games/valorant-logo.png" },
  "rocket league": { accent: "#00E5FF", logo: "/games/rocket-league-logo.png" },
  cs2: { accent: "#D97A3D", logo: "/games/cs2-logo.png" },
};

const DEFAULT_IDENTITY: GameIdentity = { accent: "#9A9AB0", logo: null };

export function getGameIdentity(name: string | null | undefined): GameIdentity {
  if (!name) return DEFAULT_IDENTITY;
  return IDENTITIES[name.trim().toLowerCase()] ?? DEFAULT_IDENTITY;
}
