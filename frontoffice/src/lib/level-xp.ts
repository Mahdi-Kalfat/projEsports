// Mirror of backoffice/src/lib/level-xp.ts. Mostly read-only — this app
// displays progress toward the next level using the admin-configured curve
// but doesn't manage it — with one narrow exception: consuming an XP_BOOST
// UserItem (see inventory/actions.ts:useItem) grants xp and needs
// normalizeLevelXp to keep level/xp in sync afterward, same as the back
// office's updateEconomy does.
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

// Carries any XP overflow into level-ups (possibly several at once), keeping
// the invariant xp < getRequiredXp(level) afterward. See backoffice's
// level-xp.ts for the canonical version this mirrors.
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
