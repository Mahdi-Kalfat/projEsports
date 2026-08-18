// Mirror of frontoffice/backoffice's lib/level-xp.ts (same pure functions,
// no DB access) — kept in sync manually, same as those two already mirror
// each other. Used by commands/profile.ts to show accurate level/XP progress.
export const DEFAULT_XP_PER_LEVEL = 100;
export const LEVELS_PER_TIER = 5;
export const MAX_LEVEL = 999;

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
