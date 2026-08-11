// Every 5 levels is a tier: tier 1 = levels 1-5, tier 2 = levels 6-10, etc.
// An admin configures how much XP one level costs *within* each tier via
// LevelXpRule (the /levels page); nothing configured at all falls back to
// this flat default so leveling still works before an admin sets anything up.
export const DEFAULT_XP_PER_LEVEL = 100;
export const LEVELS_PER_TIER = 5;
export const MAX_LEVEL = 999;

export type LevelXpRuleLike = { tier: number; xpPerLevel: number };

export function tierForLevel(level: number): number {
  return Math.ceil(Math.max(level, 1) / LEVELS_PER_TIER);
}

export function tierLevelRange(tier: number): { start: number; end: number } {
  return { start: (tier - 1) * LEVELS_PER_TIER + 1, end: tier * LEVELS_PER_TIER };
}

// The XP required to advance one level while *at* `level`. Falls back to the
// highest configured tier at or below this level's tier, so an admin only
// needs to configure early tiers explicitly for the rate to hold flat beyond
// whatever they've set up so far.
export function getRequiredXp(level: number, rules: LevelXpRuleLike[]): number {
  const tier = tierForLevel(level);
  const exact = rules.find((r) => r.tier === tier);
  if (exact) return exact.xpPerLevel;

  const below = rules.filter((r) => r.tier < tier).sort((a, b) => b.tier - a.tier)[0];
  return below?.xpPerLevel ?? DEFAULT_XP_PER_LEVEL;
}

// Carries any XP overflow into level-ups (possibly several at once), keeping
// the invariant xp < getRequiredXp(level) afterward. Used whenever an admin
// sets a user's level/xp directly, so the two fields never drift out of sync
// with the configured curve.
export function normalizeLevelXp(
  level: number,
  xp: number,
  rules: LevelXpRuleLike[],
): { level: number; xp: number } {
  let curLevel = level;
  let curXp = xp;

  for (let i = 0; i < MAX_LEVEL; i++) {
    if (curLevel >= MAX_LEVEL) {
      curXp = Math.min(curXp, Math.max(getRequiredXp(curLevel, rules) - 1, 0));
      break;
    }
    const required = getRequiredXp(curLevel, rules);
    if (required <= 0 || curXp < required) break;
    curXp -= required;
    curLevel += 1;
  }

  return { level: curLevel, xp: curXp };
}
