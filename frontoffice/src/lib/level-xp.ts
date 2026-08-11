// Mirror of backoffice/src/lib/level-xp.ts (read side only — this app never
// writes LevelXpRule or grants XP, it just displays progress toward the next
// level using the admin-configured curve).
export const DEFAULT_XP_PER_LEVEL = 100;
export const LEVELS_PER_TIER = 5;

export type LevelXpRuleLike = { tier: number; xpPerLevel: number };

export function tierForLevel(level: number): number {
  return Math.ceil(Math.max(level, 1) / LEVELS_PER_TIER);
}

// The XP required to advance one level while *at* `level`. Falls back to the
// highest configured tier at or below this level's tier — see the schema
// comment on LevelXpRule for why.
export function getRequiredXp(level: number, rules: LevelXpRuleLike[]): number {
  const tier = tierForLevel(level);
  const exact = rules.find((r) => r.tier === tier);
  if (exact) return exact.xpPerLevel;

  const below = rules.filter((r) => r.tier < tier).sort((a, b) => b.tier - a.tier)[0];
  return below?.xpPerLevel ?? DEFAULT_XP_PER_LEVEL;
}
