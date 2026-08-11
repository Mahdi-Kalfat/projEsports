import { prisma } from "@/lib/prisma";
import { BADGE_CATALOG, type BadgeDef, type BadgeCategory } from "@/lib/badges";

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

async function computeProgress(userId: string) {
  const [user, tournamentCount, eventCount, soldCount, boughtCount, earnedRows] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { createdAt: true } }),
    prisma.tournamentParticipant.count({ where: { userId } }),
    prisma.eventAttendee.count({ where: { userId } }),
    prisma.marketplaceListing.count({ where: { sellerId: userId, status: "SOLD" } }),
    prisma.marketplaceListing.count({ where: { buyerId: userId, status: "SOLD" } }),
    prisma.userBadge.findMany({ where: { userId } }),
  ]);

  const years = Math.floor((Date.now() - user.createdAt.getTime()) / MS_PER_YEAR);
  const countByCategory: Record<BadgeCategory, number> = {
    ACCOUNT_AGE: years,
    TOURNAMENT: tournamentCount,
    EVENT: eventCount,
    MARKETPLACE: 0,
  };

  function progressFor(def: BadgeDef) {
    if (def.key === "market-first-sale") return soldCount;
    if (def.key === "market-first-purchase") return boughtCount;
    return countByCategory[def.category];
  }

  return { earnedRows, progressFor };
}

// Call after any action that could newly unlock a badge (join tournament, RSVP
// event, buy/sell on the marketplace) — cheap idempotent check, safe to call
// on every relevant mutation and also opportunistically when a user views
// their own profile (self-healing if a badge tier is added to the catalog
// later without a dedicated backfill script).
export async function syncUserBadges(userId: string): Promise<string[]> {
  const { earnedRows, progressFor } = await computeProgress(userId);
  const existingKeys = new Set(earnedRows.map((b) => b.badgeKey));

  const toGrant = BADGE_CATALOG.filter((def) => !existingKeys.has(def.key) && progressFor(def) >= def.goal);
  if (toGrant.length === 0) return [];

  for (const def of toGrant) {
    await prisma.userBadge.upsert({
      where: { userId_badgeKey: { userId, badgeKey: def.key } },
      update: {},
      create: { userId, badgeKey: def.key },
    });
  }
  return toGrant.map((def) => def.key);
}

export type BadgeBoardEntry = BadgeDef & { earned: boolean; earnedAt: Date | null; progress: number };

export async function getBadgeBoard(userId: string): Promise<BadgeBoardEntry[]> {
  const { earnedRows, progressFor } = await computeProgress(userId);
  const earnedMap = new Map(earnedRows.map((b) => [b.badgeKey, b.earnedAt]));

  return BADGE_CATALOG.map((def) => {
    const earnedAt = earnedMap.get(def.key) ?? null;
    return { ...def, earned: earnedAt !== null, earnedAt, progress: Math.min(progressFor(def), def.goal) };
  });
}
